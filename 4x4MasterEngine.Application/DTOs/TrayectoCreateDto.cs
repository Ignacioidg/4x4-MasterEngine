using _4x4MasterEngine.Domain.Enums;

namespace _4x4MasterEngine.Application.DTOs;

public class TrayectoCreateDto
{
    public double Kilometros { get; set; }
    public TipoSuelo Suelo { get; set; }
}
