namespace LegalConnect.Application.Chat.DTOs;

public record MessageDto(
    Guid Id,
    Guid SenderId,
    string SenderFullName,
    string Content,
    bool IsRead,
    DateTime SentAt
);
