using LegalConnect.Domain.Entities;

namespace LegalConnect.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
    DateTime GetExpiration();
}