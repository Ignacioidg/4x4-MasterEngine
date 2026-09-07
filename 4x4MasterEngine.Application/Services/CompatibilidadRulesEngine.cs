using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Domain.Enums;
using _4x4MasterEngine.Application.Interfaces;
using _4x4MasterEngine.Application.Validation;

namespace _4x4MasterEngine.Application.Services;

public class CompatibilidadRulesEngine : ICompatibilidadRulesEngine
{
    public ValidationResult ValidateCompatibility(IEnumerable<Accesorio> proposedAccessories)
    {
        var proposedSet = proposedAccessories.ToList();
        var proposedIds = proposedSet.Select(a => a.Id).ToHashSet();

        foreach (var acc in proposedSet)
        {
            // Evaluate rules where this accessory is the origin
            if (acc.ReglasComoOrigen != null)
            {
                foreach (var rule in acc.ReglasComoOrigen)
                {
                    if (rule.Tipo == TipoRegla.Requisito)
                    {
                        if (!proposedIds.Contains(rule.ComponenteDestinoId))
                        {
                            var destinoName = rule.ComponenteDestino?.Nombre ?? $"Accesorio ID {rule.ComponenteDestinoId}";
                            return ValidationResult.Failure($"El accesorio '{acc.Nombre}' requiere que esté instalado '{destinoName}'.");
                        }
                    }
                    else if (rule.Tipo == TipoRegla.Incompatibilidad)
                    {
                        if (proposedIds.Contains(rule.ComponenteDestinoId))
                        {
                            var destinoName = rule.ComponenteDestino?.Nombre ?? $"Accesorio ID {rule.ComponenteDestinoId}";
                            return ValidationResult.Failure($"El accesorio '{acc.Nombre}' no es compatible con '{destinoName}'.");
                        }
                    }
                }
            }

            // Evaluate rules where this accessory is the destination (bidirectional check in memory)
            if (acc.ReglasComoDestino != null)
            {
                foreach (var rule in acc.ReglasComoDestino)
                {
                    if (rule.Tipo == TipoRegla.Incompatibilidad)
                    {
                        if (proposedIds.Contains(rule.ComponenteOrigenId))
                        {
                            var origenName = rule.ComponenteOrigen?.Nombre ?? $"Accesorio ID {rule.ComponenteOrigenId}";
                            return ValidationResult.Failure($"El accesorio '{origenName}' no es compatible con '{acc.Nombre}'.");
                        }
                    }
                }
            }
        }

        return ValidationResult.Success();
    }
}
