using LegalConnect.Domain.Entities;

namespace LegalConnect.Domain.Interfaces.Repositories;

public interface IChatRepository
{
    Task<Chat?> GetByIdAsync(Guid id);
    Task<Chat?> GetByUsersAsync(Guid clientId, Guid lawyerId);
    Task<IEnumerable<Chat>> GetByUserIdAsync(Guid userId);
    Task AddAsync(Chat chat);
    void Update(Chat chat);
}