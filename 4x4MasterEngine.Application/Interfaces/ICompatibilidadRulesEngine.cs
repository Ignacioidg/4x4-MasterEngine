using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.Validation;

namespace _4x4MasterEngine.Application.Interfaces;

public interface ICompatibilidadRulesEngine
{
    ValidationResult ValidateCompatibility(IEnumerable<Accesorio> proposedAccessories);
}
