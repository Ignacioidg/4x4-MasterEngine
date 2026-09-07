using _4x4MasterEngine.Domain.Enums;

namespace _4x4MasterEngine.Domain.Entities;

public class ReglaCompatibilidad
{
    public int Id { get; set; }
    
    public int ComponenteOrigenId { get; set; }
    public Accesorio ComponenteOrigen { get; set; } = null!;

    public int ComponenteDestinoId { get; set; }
    public Accesorio ComponenteDestino { get; set; } = null!;

    public TipoRegla Tipo { get; set; } // Requisito or Incompatibilidad
}
