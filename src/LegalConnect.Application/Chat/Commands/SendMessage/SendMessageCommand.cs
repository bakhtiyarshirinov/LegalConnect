using LegalConnect.Application.Chat.DTOs;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.SendMessage;

public record SendMessageCommand(
    Guid ChatId,
    Guid SenderId,
    string Content
) : IRequest<MessageDto>;
