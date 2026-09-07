using Microsoft.AspNetCore.Mvc;
using _4x4MasterEngine.Application.Interfaces;

namespace _4x4MasterEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoreController : ControllerBase
{
    private readonly IMercadoLibreService _mlService;

    public StoreController(IMercadoLibreService mlService)
    {
        _mlService = mlService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { Message = "El término de búsqueda es requerido." });
        }

        var result = await _mlService.SearchAsync(q, limit);
        return Ok(result);
    }
}
