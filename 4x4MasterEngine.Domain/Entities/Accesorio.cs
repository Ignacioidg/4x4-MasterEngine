using System.Text.Json.Serialization;

namespace _4x4MasterEngine.Domain.Entities;

public class Accesorio
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public string Categoria { get; set; } = string.Empty; // e.g. "Neumatico", "Suspension", "Paragolpes"

    // Navigation properties for rules
    [JsonIgnore]
    public ICollection<ReglaCompatibilidad> ReglasComoOrigen { get; set; } = new List<ReglaCompatibilidad>();
    
    [JsonIgnore]
    public ICollection<ReglaCompatibilidad> ReglasComoDestino { get; set; } = new List<ReglaCompatibilidad>();

    [JsonIgnore]
    public ICollection<VehiculoBuild> VehiculoBuilds { get; set; } = new List<VehiculoBuild>();
}
