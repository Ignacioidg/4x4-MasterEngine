using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.DTOs;
using _4x4MasterEngine.Application.Interfaces;
using _4x4MasterEngine.Infrastructure.Persistence;

namespace _4x4MasterEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaintenanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMaintenanceTrackerService _trackerService;

    public MaintenanceController(
        ApplicationDbContext context,
        IMaintenanceTrackerService trackerService)
    {
        _context = context;
        _trackerService = trackerService;
    }

    [HttpPost("vehicles/{vehicleId}/trayecto")]
    public async Task<IActionResult> LogTrayecto(int vehicleId, [FromBody] TrayectoCreateDto dto)
    {
        if (dto.Kilometros <= 0)
            return BadRequest(new { Message = "El kilometraje del trayecto debe ser mayor a 0." });

        var vehiculo = await _context.Vehiculos
            .Include(v => v.ComponentesDesgaste)
            .Include(v => v.Trayectos)
            .FirstOrDefaultAsync(v => v.Id == vehicleId);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        _trackerService.ProcessTrayecto(vehiculo, dto.Kilometros, dto.Suelo);
        await _context.SaveChangesAsync();

        return Ok(vehiculo);
    }

    [HttpDelete("vehicles/{vehicleId}/trayectos/{trayectoId}")]
    public async Task<IActionResult> DeleteTrayecto(int vehicleId, int trayectoId)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.ComponentesDesgaste)
            .Include(v => v.Trayectos)
            .FirstOrDefaultAsync(v => v.Id == vehicleId);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        var trayecto = vehiculo.Trayectos.FirstOrDefault(t => t.Id == trayectoId);
        if (trayecto == null) return NotFound(new { Message = "Trayecto no encontrado." });

        double coefficient = _trackerService.GetSeverityCoefficient(trayecto.Suelo);
        double wearReductionKm = trayecto.Kilometros * coefficient;

        // Revert odometer
        vehiculo.KilometrajeActual = Math.Max(vehiculo.KilometrajeInicial, vehiculo.KilometrajeActual - trayecto.Kilometros);

        // Revert wear on components
        foreach (var comp in vehiculo.ComponentesDesgaste)
        {
            comp.KilometrosSeverosAcumulados = Math.Max(0.0, comp.KilometrosSeverosAcumulados - wearReductionKm);
            comp.DesgasteAcumulado = Math.Min(100.0, (comp.KilometrosSeverosAcumulados / comp.VidaUtilKmEquivalentes) * 100.0);
        }

        _context.Trayectos.Remove(trayecto);
        await _context.SaveChangesAsync();

        return Ok(vehiculo);
    }

    [HttpPost("vehicles/{vehicleId}/components/{componentId}/reset")]
    public async Task<IActionResult> ResetComponentWear(int vehicleId, int componentId)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.ComponentesDesgaste)
            .FirstOrDefaultAsync(v => v.Id == vehicleId);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        var comp = vehiculo.ComponentesDesgaste.FirstOrDefault(c => c.Id == componentId);
        if (comp == null) return NotFound(new { Message = "Componente no encontrado." });

        comp.KilometrosSeverosAcumulados = 0.0;
        comp.DesgasteAcumulado = 0.0;

        await _context.SaveChangesAsync();

        return Ok(new { Message = $"Service registrado para '{comp.Nombre}'. Desgaste reiniciado a 0%.", Vehiculo = vehiculo });
    }

    [HttpGet("vehicles/{vehicleId}/wear")]
    public async Task<IActionResult> GetWearStatus(int vehicleId)
    {
        var vehiculo = await _context.Vehiculos
            .AsNoTracking()
            .Include(v => v.ComponentesDesgaste)
            .FirstOrDefaultAsync(v => v.Id == vehicleId);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        return Ok(vehiculo.ComponentesDesgaste.Select(c => new
        {
            c.Id,
            c.Nombre,
            c.KilometrosSeverosAcumulados,
            c.VidaUtilKmEquivalentes,
            DesgastePorcentaje = c.DesgasteAcumulado,
            RequiereReemplazo = c.DesgasteAcumulado >= 80.0
        }));
    }
}
