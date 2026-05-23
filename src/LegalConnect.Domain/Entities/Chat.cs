namespace LegalConnect.Domain.Entities;

public class Chat
{
    public Guid Id { get; private set; }
    public Guid ClientId { get; private set; }
    public Guid LawyerId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? LastMessageAt { get; private set; }

    public User Client { get; private set; }
    public Lawyer Lawyer { get; private set; }
    public ICollection<Message> Messages { get; private set; } = new List<Message>();

    private Chat() { }

    public static Chat Create(Guid clientId, Guid lawyerId)
    {
        return new Chat
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            LawyerId = lawyerId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void UpdateLastMessage() => LastMessageAt = DateTime.UtcNow;
}