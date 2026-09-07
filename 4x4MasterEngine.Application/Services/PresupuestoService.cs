using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.Interfaces;

namespace _4x4MasterEngine.Application.Services;

public class PresupuestoService : IPresupuestoService
{
    public decimal CalculateTotalBudget(IEnumerable<Accesorio> accessories)
    {
        if (accessories == null) return 0;
        return accessories.Sum(a => a.Precio);
    }
}
