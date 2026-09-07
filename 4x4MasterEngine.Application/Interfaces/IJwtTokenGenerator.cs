using _4x4MasterEngine.Domain.Entities;

namespace _4x4MasterEngine.Application.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
