using MediatR;

namespace LegalConnect.Application.Chat.Commands.MarkMessagesAsRead;

public record MarkMessagesAsReadCommand(
    Guid ChatId,
    Guid UserId
) : IRequest;
