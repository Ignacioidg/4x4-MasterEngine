using _4x4MasterEngine.Domain.Entities;

namespace _4x4MasterEngine.Application.Interfaces;

public interface IPresupuestoService
{
    decimal CalculateTotalBudget(IEnumerable<Accesorio> accessories);
}
