namespace _4x4MasterEngine.Application.Interfaces;

public interface IMercadoLibreService
{
    Task<MercadoLibreSearchResultDto> SearchAsync(string query, int limit = 20);
}

public class MercadoLibreSearchResultDto
{
    public string Query { get; set; } = string.Empty;
    public int Total { get; set; }
    public List<MercadoLibreItemDto> Results { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

public class MercadoLibreItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string CurrencyId { get; set; } = "ARS";
    public string Thumbnail { get; set; } = string.Empty;
    public string Permalink { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty; // "new", "used"
    public bool FreeShipping { get; set; }
    public string? SellerNickname { get; set; }
}
