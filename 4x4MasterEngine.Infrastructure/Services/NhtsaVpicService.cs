using System.Net.Http.Json;
using System.Text.Json.Serialization;
using _4x4MasterEngine.Application.Interfaces;

namespace _4x4MasterEngine.Infrastructure.Services;

public class NhtsaVpicService : IVehicleCatalogService
{
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "https://vpic.nhtsa.dot.gov/api/";

    // Curated 4x4 / Off-road / Truck / SUV makes with their standard NHTSA IDs
    private static readonly List<VehicleMakeDto> CuratedMakes = new()
    {
        new VehicleMakeDto { MakeId = 448, MakeName = "Toyota" },
        new VehicleMakeDto { MakeId = 483, MakeName = "Jeep" },
        new VehicleMakeDto { MakeId = 460, MakeName = "Ford" },
        new VehicleMakeDto { MakeId = 467, MakeName = "Chevrolet" },
        new VehicleMakeDto { MakeId = 496, MakeName = "RAM" },
        new VehicleMakeDto { MakeId = 478, MakeName = "Nissan" },
        new VehicleMakeDto { MakeId = 444, MakeName = "Land Rover" },
        new VehicleMakeDto { MakeId = 481, MakeName = "Mitsubishi" },
        new VehicleMakeDto { MakeId = 480, MakeName = "Suzuki" },
        new VehicleMakeDto { MakeId = 482, MakeName = "Volkswagen" },
        new VehicleMakeDto { MakeId = 472, MakeName = "GMC" },
        new VehicleMakeDto { MakeId = 468, MakeName = "Dodge" },
        new VehicleMakeDto { MakeId = 542, MakeName = "Isuzu" },
        new VehicleMakeDto { MakeId = 449, MakeName = "Mercedes-Benz" },
        new VehicleMakeDto { MakeId = 523, MakeName = "Subaru" }
    };

    public NhtsaVpicService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
    }

    public List<int> GetYears()
    {
        int currentYear = DateTime.UtcNow.Year + 1;
        var years = new List<int>();
        for (int y = currentYear; y >= 1990; y--)
        {
            years.Add(y);
        }
        return years;
    }

    public Task<List<VehicleMakeDto>> GetMakesAsync()
    {
        return Task.FromResult(CuratedMakes.OrderBy(m => m.MakeName).ToList());
    }

    public async Task<List<VehicleModelDto>> GetModelsAsync(int year, string make)
    {
        try
        {
            string endpoint = $"vehicles/GetModelsForMakeYear/make/{Uri.EscapeDataString(make)}/modelyear/{year}?format=json";
            var response = await _httpClient.GetFromJsonAsync<NhtsaModelsResponse>(endpoint);

            if (response?.Results == null || response.Results.Count == 0)
            {
                return new List<VehicleModelDto>();
            }

            return response.Results
                .Where(r => !string.IsNullOrWhiteSpace(r.ModelName))
                .Select(r => new VehicleModelDto
                {
                    ModelId = r.ModelId,
                    ModelName = r.ModelName.Trim(),
                    MakeName = r.MakeName.Trim()
                })
                .GroupBy(m => m.ModelName, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .OrderBy(m => m.ModelName)
                .ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[NHTSA API Error] Failed fetching models for {make} ({year}): {ex.Message}");
            return new List<VehicleModelDto>();
        }
    }
    public async Task<List<string>> GetTrimsAsync(int year, string make, string model)
    {
        var defaultFallbackTrims = new List<string>
        {
            "Base / Standard",
            "XL / Work Truck",
            "XLT / SR5 / Mid-Level",
            "Limited / Premium / Sahara",
            "Off-Road / Trail / Rubicon / Raptor",
            "Custom / Especial"
        };

        try
        {
            string endpoint = $"vehicles/GetCanadianVehicleSpecifications/?year={year}&make={Uri.EscapeDataString(make)}&model={Uri.EscapeDataString(model)}&format=json";
            var response = await _httpClient.GetFromJsonAsync<NhtsaCanadianSpecsResponse>(endpoint);

            if (response?.Results != null && response.Results.Count > 0)
            {
                var trimsFound = response.Results
                    .SelectMany(r => r.Specs ?? Enumerable.Empty<NhtsaSpecItem>())
                    .Where(s => s.Name == "Model" && !string.IsNullOrWhiteSpace(s.Value))
                    .Select(s => s.Value.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(s => s)
                    .ToList();

                if (trimsFound.Count > 0)
                {
                    return trimsFound;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[NHTSA Specs Error] Failed fetching trims for {make} {model} ({year}): {ex.Message}");
        }

        return defaultFallbackTrims;
    }

    public async Task<VinDecodeResultDto?> DecodeVinAsync(string vin)
    {
        if (string.IsNullOrWhiteSpace(vin) || vin.Length < 11)
            return null;

        try
        {
            string endpoint = $"vehicles/decodevinvalues/{Uri.EscapeDataString(vin)}?format=json";
            var response = await _httpClient.GetFromJsonAsync<NhtsaVinResponse>(endpoint);

            var first = response?.Results?.FirstOrDefault();
            if (first == null)
                return null;

            int.TryParse(first.ModelYear, out int year);

            return new VinDecodeResultDto
            {
                Vin = vin.ToUpper(),
                Year = year > 0 ? year : null,
                Make = first.Make ?? string.Empty,
                Model = first.Model ?? string.Empty,
                DriveType = first.DriveType ?? string.Empty,
                VehicleType = first.VehicleType ?? string.Empty,
                Trim = first.Trim ?? string.Empty
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[NHTSA API Error] Failed decoding VIN {vin}: {ex.Message}");
            return null;
        }
    }

    private class NhtsaModelsResponse
    {
        [JsonPropertyName("Count")]
        public int Count { get; set; }

        [JsonPropertyName("Message")]
        public string? Message { get; set; }

        [JsonPropertyName("Results")]
        public List<NhtsaModelItem>? Results { get; set; }
    }

    private class NhtsaModelItem
    {
        [JsonPropertyName("Make_ID")]
        public int MakeId { get; set; }

        [JsonPropertyName("Make_Name")]
        public string MakeName { get; set; } = string.Empty;

        [JsonPropertyName("Model_ID")]
        public int ModelId { get; set; }

        [JsonPropertyName("Model_Name")]
        public string ModelName { get; set; } = string.Empty;
    }

    private class NhtsaVinResponse
    {
        [JsonPropertyName("Results")]
        public List<NhtsaVinItem>? Results { get; set; }
    }

    private class NhtsaVinItem
    {
        [JsonPropertyName("Make")]
        public string? Make { get; set; }

        [JsonPropertyName("Model")]
        public string? Model { get; set; }

        [JsonPropertyName("ModelYear")]
        public string? ModelYear { get; set; }

        [JsonPropertyName("DriveType")]
        public string? DriveType { get; set; }

        [JsonPropertyName("VehicleType")]
        public string? VehicleType { get; set; }

        [JsonPropertyName("Trim")]
        public string? Trim { get; set; }
    }

    private class NhtsaCanadianSpecsResponse
    {
        [JsonPropertyName("Results")]
        public List<NhtsaCanadianSpecResult>? Results { get; set; }
    }

    private class NhtsaCanadianSpecResult
    {
        [JsonPropertyName("Specs")]
        public List<NhtsaSpecItem>? Specs { get; set; }
    }

    private class NhtsaSpecItem
    {
        [JsonPropertyName("Name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("Value")]
        public string Value { get; set; } = string.Empty;
    }
}
