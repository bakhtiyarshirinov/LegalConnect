using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly ApplicationDbContext _context;

    public ChatRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ─── Чаты ───────────────────────────────────────────────────────────────

    public async Task<Chat?> GetByIdAsync(Guid id)
        => await _context.Chats
            .Include(c => c.Messages.OrderBy(m => m.SentAt))
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<Chat?> GetByUsersAsync(Guid clientId, Guid lawyerId)
        => await _context.Chats
            .FirstOrDefaultAsync(c => c.ClientId == clientId && c.LawyerId == lawyerId);

    public async Task<IEnumerable<Chat>> GetByUserIdAsync(Guid userId)
        => await _context.Chats
            .Include(c => c.Client)
            .Include(c => c.Lawyer).ThenInclude(l => l.User)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
            .Where(c => c.ClientId == userId || c.LawyerId == userId)
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync();

    public async Task<bool> ExistsByClientAndLawyerAsync(Guid clientId, Guid lawyerId)
        => await _context.Chats
            .AnyAsync(c => c.ClientId == clientId && c.LawyerId == lawyerId);

    public async Task AddAsync(Chat chat)
        => await _context.Chats.AddAsync(chat);

    public void Update(Chat chat)
        => _context.Chats.Update(chat);

    // ─── Сообщения ──────────────────────────────────────────────────────────

    public async Task<IEnumerable<Message>> GetMessagesAsync(Guid chatId)
        => await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatId == chatId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

    public async Task AddMessageAsync(Message message)
        => await _context.Messages.AddAsync(message);

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        var clientUnread = await _context.Messages
            .Where(m => !m.IsRead && m.SenderId != userId && m.Chat.ClientId == userId)
            .CountAsync();

        var lawyerProfile = await _context.Lawyers
            .FirstOrDefaultAsync(l => l.UserId == userId);

        var lawyerUnread = 0;
        if (lawyerProfile != null)
        {
            lawyerUnread = await _context.Messages
                .Where(m => !m.IsRead && m.SenderId != userId && m.Chat.LawyerId == lawyerProfile.Id)
                .CountAsync();
        }

        return clientUnread + lawyerUnread;
    }
}