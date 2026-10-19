using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _4x4MasterEngine.Infrastructure.Persistence;

namespace _4x4MasterEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuditController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs()
    {
        var logs = await _context.AuditLogs
            .AsNoTracking()
            .OrderByDescending(l => l.Timestamp)
            .Take(100)
            .ToListAsync();
        return Ok(logs);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetSystemUsers()
    {
        var users = await _context.Users
            .AsNoTracking()
            .ToListAsync();

        var totalVehicles = await _context.Vehiculos.CountAsync();
        var logCounts = await _context.AuditLogs
            .AsNoTracking()
            .GroupBy(l => l.Username)
            .Select(g => new { Username = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Username, x => x.Count, StringComparer.OrdinalIgnoreCase);

        var result = users.Select(u => new
        {
            u.Id,
            u.Username,
            Email = $"{u.Username.ToLowerInvariant()}@4me.io",
            u.Role,
            VehiclesCount = totalVehicles,
            ActionsCount = logCounts.TryGetValue(u.Username, out var c) ? c : 0,
            Status = "ACTIVO"
        });

        return Ok(result);
    }
}
