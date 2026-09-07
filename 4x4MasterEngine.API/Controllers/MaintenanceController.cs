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
        var vehiculo = await _context.Vehiculos
            .Include(v => v.ComponentesDesgaste)
            .Include(v => v.Trayectos)
            .FirstOrDefaultAsync(v => v.Id == vehicleId);

        if (vehiculo == null) return NotFound(new { Message = "Vehiculo no encontrado." });

        _trackerService.ProcessTrayecto(vehiculo, dto.Kilometros, dto.Suelo);
        await _context.SaveChangesAsync();

        return Ok(vehiculo);
    }

    [HttpGet("vehicles/{vehicleId}/wear")]
    public async Task<IActionResult> GetWearStatus(int vehicleId)
    {
        var vehiculo = await _context.Vehiculos
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
            RequiereReemplazo = c.DesgasteAcumulado >= 90.0
        }));
    }
}
