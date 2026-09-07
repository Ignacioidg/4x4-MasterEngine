using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.DTOs;
using _4x4MasterEngine.Application.Interfaces;
using _4x4MasterEngine.Application.Validation;
using _4x4MasterEngine.Infrastructure.Persistence;

namespace _4x4MasterEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiculosController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICompatibilidadRulesEngine _rulesEngine;
    private readonly IPresupuestoService _presupuestoService;

    public VehiculosController(
        ApplicationDbContext context,
        ICompatibilidadRulesEngine rulesEngine,
        IPresupuestoService presupuestoService)
    {
        _context = context;
        _rulesEngine = rulesEngine;
        _presupuestoService = presupuestoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var vehiculos = await _context.Vehiculos
            .Include(v => v.AccesoriosEquipados)
            .ToListAsync();
        return Ok(vehiculos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.AccesoriosEquipados)
            .Include(v => v.ComponentesDesgaste)
            .Include(v => v.Trayectos)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehiculo == null) return NotFound();
        return Ok(vehiculo);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] VehiculoCreateDto dto)
    {
        var vehiculo = new Vehiculo
        {
            Marca = dto.Marca,
            Modelo = dto.Modelo,
            Anio = dto.Anio,
            Patente = dto.Patente,
            TrimId = dto.TrimId,
            KilometrajeInicial = dto.KilometrajeInicial,
            KilometrajeActual = dto.KilometrajeInicial,
            ComponentesDesgaste = new List<ComponenteDesgaste>
            {
                new ComponenteDesgaste { Nombre = "Suspension y Amortiguadores", VidaUtilKmEquivalentes = 80000, DesgasteAcumulado = 0, KilometrosSeverosAcumulados = 0 },
                new ComponenteDesgaste { Nombre = "Neumaticos Todoterreno", VidaUtilKmEquivalentes = 60000, DesgasteAcumulado = 0, KilometrosSeverosAcumulados = 0 },
                new ComponenteDesgaste { Nombre = "Pastillas y Discos de Freno", VidaUtilKmEquivalentes = 40000, DesgasteAcumulado = 0, KilometrosSeverosAcumulados = 0 }
            }
        };

        _context.Vehiculos.Add(vehiculo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = vehiculo.Id }, vehiculo);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] VehiculoUpdateDto dto)
    {
        var vehiculo = await _context.Vehiculos.FindAsync(id);
        if (vehiculo == null)
            return NotFound(new { Message = "Vehiculo no encontrado." });

        if (!string.IsNullOrWhiteSpace(dto.Patente))
            vehiculo.Patente = dto.Patente.Trim().ToUpper();

        if (!string.IsNullOrWhiteSpace(dto.TrimId))
            vehiculo.TrimId = dto.TrimId.Trim();

        if (dto.KilometrajeActual.HasValue && dto.KilometrajeActual.Value >= 0)
            vehiculo.KilometrajeActual = dto.KilometrajeActual.Value;

        if (!string.IsNullOrWhiteSpace(dto.Marca))
            vehiculo.Marca = dto.Marca.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Modelo))
            vehiculo.Modelo = dto.Modelo.Trim();

        if (dto.Anio.HasValue && dto.Anio.Value > 1900)
            vehiculo.Anio = dto.Anio.Value;

        await _context.SaveChangesAsync();
        return Ok(vehiculo);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.ComponentesDesgaste)
            .Include(v => v.Trayectos)
            .Include(v => v.Builds)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehiculo == null)
            return NotFound(new { Message = "Vehiculo no encontrado." });

        _context.Vehiculos.Remove(vehiculo);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Vehiculo y registros asociados eliminados con éxito." });
    }

    [HttpPost("{id}/accessories/{accessoryId}")]
    public async Task<IActionResult> EquipAccessory(int id, int accessoryId)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.AccesoriosEquipados)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        var accesorio = await _context.Accesorios.FindAsync(accessoryId);
        if (accesorio == null) return NotFound(new { Message = "Accesorio no encontrado." });

        if (vehiculo.AccesoriosEquipados.Any(a => a.Id == accessoryId))
        {
            return BadRequest(new { Message = "El vehiculo ya tiene equipado este accesorio." });
        }

        // Build list of proposed accessories
        var proposed = vehiculo.AccesoriosEquipados.ToList();
        proposed.Add(accesorio);

        // Fetch accessories with rules in-memory to populate navigation properties
        var proposedIds = proposed.Select(p => p.Id).ToList();
        var proposedWithRules = await _context.Accesorios
            .Include(a => a.ReglasComoOrigen)
                .ThenInclude(r => r.ComponenteDestino)
            .Include(a => a.ReglasComoDestino)
                .ThenInclude(r => r.ComponenteOrigen)
            .Where(a => proposedIds.Contains(a.Id))
            .ToListAsync();

        // Validate
        var validation = _rulesEngine.ValidateCompatibility(proposedWithRules);
        if (!validation.IsValid)
        {
            return BadRequest(new { Message = validation.ErrorMessage });
        }

        // If validated, add to db relation
        vehiculo.AccesoriosEquipados.Add(accesorio);
        await _context.SaveChangesAsync();

        return Ok(vehiculo);
    }

    [HttpDelete("{id}/accessories/{accessoryId}")]
    public async Task<IActionResult> UnequipAccessory(int id, int accessoryId)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.AccesoriosEquipados)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        var accesorio = vehiculo.AccesoriosEquipados.FirstOrDefault(a => a.Id == accessoryId);
        if (accesorio == null) return BadRequest(new { Message = "El vehiculo no tiene equipado este accesorio." });

        // Build proposed list removing this one
        var proposed = vehiculo.AccesoriosEquipados.Where(a => a.Id != accessoryId).ToList();

        // Fetch remaining with rules to verify that removing this doesn't break dependencies of other equipped accessories
        var proposedIds = proposed.Select(p => p.Id).ToList();
        if (proposedIds.Any())
        {
            var proposedWithRules = await _context.Accesorios
                .Include(a => a.ReglasComoOrigen)
                    .ThenInclude(r => r.ComponenteDestino)
                .Include(a => a.ReglasComoDestino)
                    .ThenInclude(r => r.ComponenteOrigen)
                .Where(a => proposedIds.Contains(a.Id))
                .ToListAsync();

            // Validate compatibility of the remaining subset
            var validation = _rulesEngine.ValidateCompatibility(proposedWithRules);
            if (!validation.IsValid)
            {
                return BadRequest(new { Message = validation.ErrorMessage });
            }
        }

        vehiculo.AccesoriosEquipados.Remove(accesorio);
        await _context.SaveChangesAsync();

        return Ok(vehiculo);
    }

    [HttpGet("{id}/budget")]
    public async Task<IActionResult> GetBudget(int id)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.AccesoriosEquipados)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehiculo == null) return NotFound();

        var total = _presupuestoService.CalculateTotalBudget(vehiculo.AccesoriosEquipados);
        return Ok(new {
            VehiculoId = vehiculo.Id,
            Vehiculo = $"{vehiculo.Marca} {vehiculo.Modelo}",
            CostoTotalAccesorios = total
        });
    }

    [HttpPost("{id}/builds")]
    public async Task<IActionResult> SaveBuild(int id, [FromBody] BuildSaveDto dto)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.AccesoriosEquipados)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { Message = "El nombre de la build es obligatorio." });

        var build = new VehiculoBuild
        {
            Nombre = dto.Nombre,
            VehiculoId = vehiculo.Id,
            Accesorios = vehiculo.AccesoriosEquipados.ToList()
        };

        _context.VehiculoBuilds.Add(build);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Build guardada con éxito.", BuildId = build.Id });
    }

    [HttpGet("builds/all")]
    public async Task<IActionResult> GetAllBuilds()
    {
        var builds = await _context.VehiculoBuilds
            .Include(b => b.Accesorios)
            .Include(b => b.Vehiculo)
            .Select(b => new {
                b.Id,
                b.Nombre,
                b.VehiculoId,
                Vehiculo = b.Vehiculo != null ? $"{b.Vehiculo.Marca} {b.Vehiculo.Modelo}" : "Desconocido",
                CantidadAccesorios = b.Accesorios.Count
            })
            .ToListAsync();

        return Ok(builds);
    }

    [HttpGet("{id}/builds")]
    public async Task<IActionResult> GetBuilds(int id)
    {
        var builds = await _context.VehiculoBuilds
            .Include(b => b.Accesorios)
            .Include(b => b.Vehiculo)
            .Where(b => b.VehiculoId == id)
            .Select(b => new {
                b.Id,
                b.Nombre,
                b.VehiculoId,
                Vehiculo = b.Vehiculo != null ? $"{b.Vehiculo.Marca} {b.Vehiculo.Modelo}" : "Desconocido",
                CantidadAccesorios = b.Accesorios.Count
            })
            .ToListAsync();

        return Ok(builds);
    }

    [HttpPut("{id}/builds/{buildId}")]
    public async Task<IActionResult> RenameBuild(int id, int buildId, [FromBody] BuildSaveDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { Message = "El nombre de la build no puede estar vacío." });

        var build = await _context.VehiculoBuilds.FirstOrDefaultAsync(b => b.Id == buildId && b.VehiculoId == id);
        if (build == null) return NotFound(new { Message = "Build no encontrada." });

        build.Nombre = dto.Nombre.Trim();
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Build renombrada con éxito.", BuildId = build.Id, Nombre = build.Nombre });
    }

    [HttpDelete("{id}/builds/{buildId}")]
    public async Task<IActionResult> DeleteBuild(int id, int buildId)
    {
        var build = await _context.VehiculoBuilds.FirstOrDefaultAsync(b => b.Id == buildId && b.VehiculoId == id);
        if (build == null) return NotFound(new { Message = "Build no encontrada." });

        _context.VehiculoBuilds.Remove(build);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Build eliminada con éxito." });
    }

    [HttpPost("{id}/builds/{buildId}/load")]
    public async Task<IActionResult> LoadBuild(int id, int buildId)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.AccesoriosEquipados)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        var build = await _context.VehiculoBuilds
            .Include(b => b.Accesorios)
            .FirstOrDefaultAsync(b => b.Id == buildId && b.VehiculoId == id);

        if (build == null) return NotFound(new { Message = "Build no encontrada." });

        // Validate the build again just in case rules changed since it was saved
        if (build.Accesorios.Any())
        {
            var proposedIds = build.Accesorios.Select(a => a.Id).ToList();
            var proposedWithRules = await _context.Accesorios
                .Include(a => a.ReglasComoOrigen)
                    .ThenInclude(r => r.ComponenteDestino)
                .Include(a => a.ReglasComoDestino)
                    .ThenInclude(r => r.ComponenteOrigen)
                .Where(a => proposedIds.Contains(a.Id))
                .ToListAsync();

            var validation = _rulesEngine.ValidateCompatibility(proposedWithRules);
            if (!validation.IsValid)
            {
                return BadRequest(new { Message = "La build contiene configuraciones que ya no son válidas: " + validation.ErrorMessage });
            }
        }

        // Replace current accessories with build accessories
        vehiculo.AccesoriosEquipados.Clear();
        foreach(var acc in build.Accesorios)
        {
            vehiculo.AccesoriosEquipados.Add(acc);
        }

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Build cargada exitosamente.", Vehiculo = vehiculo });
    }
}
