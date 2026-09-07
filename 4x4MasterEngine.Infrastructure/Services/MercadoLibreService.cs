using System.Net.Http.Json;
using System.Text.Json.Serialization;
using _4x4MasterEngine.Application.Interfaces;

namespace _4x4MasterEngine.Infrastructure.Services;

public class MercadoLibreService : IMercadoLibreService
{
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "https://api.mercadolibre.com/sites/MLA/";

    public MercadoLibreService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(5);
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "4x4MasterEngine/5.0");
    }

    public async Task<MercadoLibreSearchResultDto> SearchAsync(string query, int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new MercadoLibreSearchResultDto
            {
                Query = string.Empty,
                Total = 0,
                Results = new List<MercadoLibreItemDto>()
            };
        }

        try
        {
            string endpoint = $"search?q={Uri.EscapeDataString(query.Trim())}&limit={Math.Clamp(limit, 1, 50)}";
            var response = await _httpClient.GetFromJsonAsync<MlApiResponse>(endpoint);

            if (response == null || response.Results == null)
            {
                return new MercadoLibreSearchResultDto
                {
                    Query = query,
                    Total = 0,
                    Results = new List<MercadoLibreItemDto>()
                };
            }

            var items = response.Results.Select(r => new MercadoLibreItemDto
            {
                Id = r.Id ?? string.Empty,
                Title = r.Title ?? string.Empty,
                Price = r.Price ?? 0m,
                CurrencyId = r.CurrencyId ?? "ARS",
                Thumbnail = (r.Thumbnail ?? string.Empty).Replace("http://", "https://"),
                Permalink = r.Permalink ?? string.Empty,
                Condition = r.Condition == "new" ? "Nuevo" : r.Condition == "used" ? "Usado" : (r.Condition ?? "Nuevo"),
                FreeShipping = r.Shipping?.FreeShipping ?? false,
                SellerNickname = r.Seller?.Nickname
            }).ToList();

            return new MercadoLibreSearchResultDto
            {
                Query = query,
                Total = response.Paging?.Total ?? items.Count,
                Results = items
            };
        }
        catch (TaskCanceledException)
        {
            Console.WriteLine($"[MercadoLibre API] Timeout al buscar '{query}' (límite 5s superado)");
            return new MercadoLibreSearchResultDto
            {
                Query = query,
                Total = 0,
                Results = new List<MercadoLibreItemDto>(),
                ErrorMessage = "El servicio de Mercado Libre demoró en responder. Por favor intente nuevamente."
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MercadoLibre API Error] Falló búsqueda para '{query}': {ex.Message}");
            return new MercadoLibreSearchResultDto
            {
                Query = query,
                Total = 0,
                Results = new List<MercadoLibreItemDto>(),
                ErrorMessage = "No se pudieron obtener resultados de Mercado Libre en este momento."
            };
        }
    }

    private class MlApiResponse
    {
        [JsonPropertyName("paging")]
        public MlPaging? Paging { get; set; }

        [JsonPropertyName("results")]
        public List<MlItemResult>? Results { get; set; }
    }

    private class MlPaging
    {
        [JsonPropertyName("total")]
        public int Total { get; set; }
    }

    private class MlItemResult
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("price")]
        public decimal? Price { get; set; }

        [JsonPropertyName("currency_id")]
        public string? CurrencyId { get; set; }

        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }

        [JsonPropertyName("permalink")]
        public string? Permalink { get; set; }

        [JsonPropertyName("condition")]
        public string? Condition { get; set; }

        [JsonPropertyName("shipping")]
        public MlShipping? Shipping { get; set; }

        [JsonPropertyName("seller")]
        public MlSeller? Seller { get; set; }
    }

    private class MlShipping
    {
        [JsonPropertyName("free_shipping")]
        public bool FreeShipping { get; set; }
    }

    private class MlSeller
    {
        [JsonPropertyName("nickname")]
        public string? Nickname { get; set; }
    }
}
