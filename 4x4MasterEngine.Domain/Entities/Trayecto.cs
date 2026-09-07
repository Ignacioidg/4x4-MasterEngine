using _4x4MasterEngine.Domain.Enums;

namespace _4x4MasterEngine.Domain.Entities;

public class Trayecto
{
    public int Id { get; set; }
    public int VehiculoId { get; set; }
    public double Kilometros { get; set; }
    public TipoSuelo Suelo { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
}
