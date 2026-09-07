using _4x4MasterEngine.Domain.Entities;

namespace _4x4MasterEngine.Application.Interfaces;

public interface IAccesorioRepository : IRepository<Accesorio>
{
    Task<IEnumerable<Accesorio>> GetAccesoriosByIdsAsync(IEnumerable<int> ids);
}
