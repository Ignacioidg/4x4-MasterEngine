namespace _4x4MasterEngine.Domain.Entities;

public class ComponenteDesgaste
{
    public int Id { get; set; }
    public int VehiculoId { get; set; }
    public string Nombre { get; set; } = string.Empty; // e.g. "Suspension", "Neumatico", "Frenos"
    public double DesgasteAcumulado { get; set; } // Percentage: 0 to 100
    public double VidaUtilKmEquivalentes { get; set; } = 100000; // Wear limit
    public double KilometrosSeverosAcumulados { get; set; } // severity * km
}
