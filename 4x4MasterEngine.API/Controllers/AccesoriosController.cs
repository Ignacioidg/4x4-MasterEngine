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
        var accesorios = await _context.Accesorios.ToListAsync();
        return Ok(accesorios);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var accesorio = await _context.Accesorios.FindAsync(id);
        if (accesorio == null) return NotFound();
        return Ok(accesorio);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AccesorioCreateDto dto)
    {
        var accesorio = new Accesorio
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            Precio = dto.Precio,
            Categoria = dto.Categoria
        };

        _context.Accesorios.Add(accesorio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = accesorio.Id }, accesorio);
    }

    [HttpPost("rules")]
    public async Task<IActionResult> CreateRule([FromBody] ReglaCreateDto dto)
    {
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

        return Ok(rule);
    }

    [HttpGet("rules")]
    public async Task<IActionResult> GetRules()
    {
        var rules = await _context.ReglasCompatibilidad
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
