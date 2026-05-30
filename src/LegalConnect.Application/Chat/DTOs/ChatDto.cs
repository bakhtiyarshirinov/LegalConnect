namespace LegalConnect.Application.Chat.DTOs;

public record ChatDto(
    Guid Id,
    string LawyerFullName,
    string ClientFullName,
    DateTime? LastMessageAt,
    Guid LawyerUserId
);
