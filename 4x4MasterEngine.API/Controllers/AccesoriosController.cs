using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.DTOs;
using _4x4MasterEngine.Infrastructure.Persistence;

namespace _4x4MasterEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccesoriosController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AccesoriosController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var accesorios = await _context.Accesorios
            .AsNoTracking()
            .ToListAsync();
        return Ok(accesorios);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var accesorio = await _context.Accesorios
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);
        if (accesorio == null) return NotFound();
        return Ok(accesorio);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AccesorioCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { Message = "El nombre del accesorio es obligatorio." });

        var accesorio = new Accesorio
        {
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim() ?? string.Empty,
            Precio = dto.Precio,
            Categoria = string.IsNullOrWhiteSpace(dto.Categoria) ? "General" : dto.Categoria.Trim()
        };

        _context.Accesorios.Add(accesorio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = accesorio.Id }, accesorio);
    }

    [HttpPost("rules")]
    public async Task<IActionResult> CreateRule([FromBody] ReglaCreateDto dto)
    {
        if (dto.ComponenteOrigenId == dto.ComponenteDestinoId)
        {
            return BadRequest(new { Message = "Un accesorio no puede tener una regla consigo mismo." });
        }

        var origen = await _context.Accesorios.FindAsync(dto.ComponenteOrigenId);
        var destino = await _context.Accesorios.FindAsync(dto.ComponenteDestinoId);

        if (origen == null || destino == null)
        {
            return BadRequest(new { Message = "Origen o Destino no existen." });
        }

        var rule = new ReglaCompatibilidad
        {
            ComponenteOrigenId = dto.ComponenteOrigenId,
            ComponenteDestinoId = dto.ComponenteDestinoId,
            Tipo = dto.Tipo
        };

        _context.ReglasCompatibilidad.Add(rule);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            rule.Id,
            rule.ComponenteOrigenId,
            ComponenteOrigenNombre = origen.Nombre,
            rule.ComponenteDestinoId,
            ComponenteDestinoNombre = destino.Nombre,
            Tipo = rule.Tipo.ToString()
        });
    }

    [HttpDelete("rules/{id}")]
    public async Task<IActionResult> DeleteRule(int id)
    {
        var rule = await _context.ReglasCompatibilidad.FindAsync(id);
        if (rule == null) return NotFound(new { Message = "Regla no encontrada." });

        _context.ReglasCompatibilidad.Remove(rule);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Regla eliminada con éxito." });
    }

    [HttpGet("rules")]
    public async Task<IActionResult> GetRules()
    {
        var rules = await _context.ReglasCompatibilidad
            .AsNoTracking()
            .Include(r => r.ComponenteOrigen)
            .Include(r => r.ComponenteDestino)
            .ToListAsync();
        return Ok(rules.Select(r => new {
            r.Id,
            r.ComponenteOrigenId,
            ComponenteOrigenNombre = r.ComponenteOrigen.Nombre,
            r.ComponenteDestinoId,
            ComponenteDestinoNombre = r.ComponenteDestino.Nombre,
            Tipo = r.Tipo.ToString()
        }));
    }
}
