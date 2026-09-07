using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using _4x4MasterEngine.Application.Interfaces;

namespace _4x4MasterEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CarQueryController : ControllerBase
{
    private readonly ICarQueryService _carQueryService;

    public CarQueryController(ICarQueryService carQueryService)
    {
        _carQueryService = carQueryService;
    }

    [HttpGet("years")]
    public async Task<IActionResult> GetYears()
    {
        var json = await _carQueryService.GetYearsAsync();
        return Content(json, "application/json");
    }

    [HttpGet("makes")]
    public async Task<IActionResult> GetMakes([FromQuery] int year)
    {
        var json = await _carQueryService.GetMakesAsync(year);
        return Content(json, "application/json");
    }

    [HttpGet("models")]
    public async Task<IActionResult> GetModels([FromQuery] int year, [FromQuery] string make)
    {
        var json = await _carQueryService.GetModelsAsync(year, make);
        return Content(json, "application/json");
    }

    [HttpGet("trims")]
    public async Task<IActionResult> GetTrims([FromQuery] int year, [FromQuery] string make, [FromQuery] string model)
    {
        var json = await _carQueryService.GetTrimsAsync(year, make, model);
        return Content(json, "application/json");
    }
}
