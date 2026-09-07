namespace _4x4MasterEngine.Application.DTOs;

public class VehiculoCreateDto
{
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public int Anio { get; set; }
    public string Patente { get; set; } = string.Empty;
    public string TrimId { get; set; } = string.Empty;
    public double KilometrajeInicial { get; set; }
}
