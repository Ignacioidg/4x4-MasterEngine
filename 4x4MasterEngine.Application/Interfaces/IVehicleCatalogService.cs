namespace _4x4MasterEngine.Application.Interfaces;

public interface IVehicleCatalogService
{
    List<int> GetYears();
    Task<List<VehicleMakeDto>> GetMakesAsync();
    Task<List<VehicleModelDto>> GetModelsAsync(int year, string make);
    Task<List<string>> GetTrimsAsync(int year, string make, string model);
    Task<VinDecodeResultDto?> DecodeVinAsync(string vin);
}

public class VehicleMakeDto
{
    public int MakeId { get; set; }
    public string MakeName { get; set; } = string.Empty;
}

public class VehicleModelDto
{
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public string MakeName { get; set; } = string.Empty;
}

public class VinDecodeResultDto
{
    public string Vin { get; set; } = string.Empty;
    public int? Year { get; set; }
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string DriveType { get; set; } = string.Empty; // e.g. "4WD/4-Wheel Drive/4x4", "AWD"
    public string VehicleType { get; set; } = string.Empty; // "TRUCK", "MULTIPURPOSE PASSENGER VEHICLE (MPV)"
    public string Trim { get; set; } = string.Empty;
}
