namespace _4x4MasterEngine.Domain.Entities;

public class Vehiculo
{
    public int Id { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public int Anio { get; set; }
    public string Patente { get; set; } = string.Empty;
    public double KilometrajeInicial { get; set; }
    public double KilometrajeActual { get; set; }
    public string TrimId { get; set; } = string.Empty;

    // Relationships
    public ICollection<Accesorio> AccesoriosEquipados { get; set; } = new List<Accesorio>();
    public ICollection<ComponenteDesgaste> ComponentesDesgaste { get; set; } = new List<ComponenteDesgaste>();
    public ICollection<Trayecto> Trayectos { get; set; } = new List<Trayecto>();
    public ICollection<VehiculoBuild> Builds { get; set; } = new List<VehiculoBuild>();
}
