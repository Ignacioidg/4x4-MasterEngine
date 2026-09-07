namespace _4x4MasterEngine.Domain.Entities;

public class VehiculoBuild
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int VehiculoId { get; set; }
    public Vehiculo Vehiculo { get; set; } = null!;

    // Relación N:M
    public ICollection<Accesorio> Accesorios { get; set; } = new List<Accesorio>();
}
