using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using _4x4MasterEngine.Application.Interfaces;

namespace _4x4MasterEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly IVehicleCatalogService _catalogService;

    public CatalogController(IVehicleCatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    [HttpGet("years")]
    public IActionResult GetYears()
    {
        var years = _catalogService.GetYears();
        return Ok(years);
    }

    [HttpGet("makes")]
    public async Task<IActionResult> GetMakes()
    {
        var makes = await _catalogService.GetMakesAsync();
        return Ok(makes);
    }

    [HttpGet("models")]
    public async Task<IActionResult> GetModels([FromQuery] int year, [FromQuery] string make)
    {
        if (year < 1950 || string.IsNullOrWhiteSpace(make))
        {
            return BadRequest(new { Message = "El año y la marca son requeridos." });
        }

        var models = await _catalogService.GetModelsAsync(year, make);
        return Ok(models);
    }

    [HttpGet("trims")]
    public async Task<IActionResult> GetTrims([FromQuery] int year, [FromQuery] string make, [FromQuery] string model)
    {
        if (year < 1950 || string.IsNullOrWhiteSpace(make) || string.IsNullOrWhiteSpace(model))
        {
            return BadRequest(new { Message = "El año, la marca y el modelo son requeridos." });
        }

        var trims = await _catalogService.GetTrimsAsync(year, make, model);
        return Ok(trims);
    }

    [HttpGet("decode-vin/{vin}")]
    public async Task<IActionResult> DecodeVin(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin))
        {
            return BadRequest(new { Message = "El número de chasis (VIN) es requerido." });
        }

        var result = await _catalogService.DecodeVinAsync(vin);
        if (result == null)
        {
            return NotFound(new { Message = "No se pudo decodificar el VIN proporcionado o no existe en la base de datos de NHTSA." });
        }

        return Ok(result);
    }
}
