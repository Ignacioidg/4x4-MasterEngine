using Microsoft.EntityFrameworkCore;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.Interfaces;
using _4x4MasterEngine.Infrastructure.Persistence;

namespace _4x4MasterEngine.Infrastructure.Repositories;

public class AccesorioRepository : Repository<Accesorio>, IAccesorioRepository
{
    public AccesorioRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Accesorio>> GetAccesoriosByIdsAsync(IEnumerable<int> ids)
    {
        return await _context.Accesorios
            .Where(a => ids.Contains(a.Id))
            .ToListAsync();
    }
}
