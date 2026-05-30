using LegalConnect.Domain.Entities;

namespace LegalConnect.Domain.Interfaces.Repositories;

public interface IChatRepository
{
    // Чаты
    Task<Chat?> GetByIdAsync(Guid id);
    Task<Chat?> GetByUsersAsync(Guid clientId, Guid lawyerId);
    Task<IEnumerable<Chat>> GetByUserIdAsync(Guid userId);
    Task<bool> ExistsByClientAndLawyerAsync(Guid clientId, Guid lawyerId);
    Task AddAsync(Chat chat);
    void Update(Chat chat);

    // Сообщения
    Task<IEnumerable<Message>> GetMessagesAsync(Guid chatId);
    Task AddMessageAsync(Message message);
    Task<int> GetUnreadCountAsync(Guid userId);
}