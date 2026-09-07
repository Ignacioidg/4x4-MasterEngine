using Microsoft.EntityFrameworkCore;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.Interfaces;
using _4x4MasterEngine.Infrastructure.Persistence;

namespace _4x4MasterEngine.Infrastructure.Repositories;

public class VehiculoRepository : Repository<Vehiculo>, IVehiculoRepository
{
    public VehiculoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Vehiculo?> GetByIdWithDetailsAsync(int id)
    {
        return await _context.Vehiculos
            .Include(v => v.AccesoriosEquipados)
            .Include(v => v.ComponentesDesgaste)
            .Include(v => v.Trayectos)
            .FirstOrDefaultAsync(v => v.Id == id);
    }
}
