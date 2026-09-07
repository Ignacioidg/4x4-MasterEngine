using _4x4MasterEngine.Domain.Entities;

namespace _4x4MasterEngine.Application.Interfaces;

public interface IVehiculoRepository : IRepository<Vehiculo>
{
    Task<Vehiculo?> GetByIdWithDetailsAsync(int id);
}
