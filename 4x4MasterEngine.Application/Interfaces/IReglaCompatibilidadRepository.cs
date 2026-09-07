using _4x4MasterEngine.Domain.Entities;

namespace _4x4MasterEngine.Application.Interfaces;

public interface IReglaCompatibilidadRepository : IRepository<ReglaCompatibilidad>
{
    Task<IEnumerable<ReglaCompatibilidad>> GetRulesForAccessoriesAsync(IEnumerable<int> accessoryIds);
}
