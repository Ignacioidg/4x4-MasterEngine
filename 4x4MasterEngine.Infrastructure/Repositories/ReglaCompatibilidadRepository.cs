using Microsoft.EntityFrameworkCore;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.Interfaces;
using _4x4MasterEngine.Infrastructure.Persistence;

namespace _4x4MasterEngine.Infrastructure.Repositories;

public class ReglaCompatibilidadRepository : Repository<ReglaCompatibilidad>, IReglaCompatibilidadRepository
{
    public ReglaCompatibilidadRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ReglaCompatibilidad>> GetRulesForAccessoriesAsync(IEnumerable<int> accessoryIds)
    {
        return await _context.ReglasCompatibilidad
            .Include(r => r.ComponenteOrigen)
            .Include(r => r.ComponenteDestino)
            .Where(r => accessoryIds.Contains(r.ComponenteOrigenId) || accessoryIds.Contains(r.ComponenteDestinoId))
            .ToListAsync();
    }
}
