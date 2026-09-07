using _4x4MasterEngine.Domain.Enums;

namespace _4x4MasterEngine.Application.DTOs;

public class ReglaCreateDto
{
    public int ComponenteOrigenId { get; set; }
    public int ComponenteDestinoId { get; set; }
    public TipoRegla Tipo { get; set; }
}
