using LegalConnect.Domain.Enums;

namespace LegalConnect.Domain.Entities;

public class Message
{
    public Guid Id { get; private set; }
    public Guid ChatId { get; private set; }
    public Guid SenderId { get; private set; }
    public string Content { get; private set; }
    public MessageType Type { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime SentAt { get; private set; }

    public Chat Chat { get; private set; }
    public User Sender { get; private set; }

    private Message() { }

    public static Message Create(
        Guid chatId,
        Guid senderId,
        string content,
        MessageType type = MessageType.Text)
    {
        return new Message
        {
            Id = Guid.NewGuid(),
            ChatId = chatId,
            SenderId = senderId,
            Content = content,
            Type = type,
            IsRead = false,
            SentAt = DateTime.UtcNow
        };
    }

    public void MarkAsRead() => IsRead = true;
}