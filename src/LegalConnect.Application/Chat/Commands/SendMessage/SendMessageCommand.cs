using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Domain.Enums;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.SendMessage;

public record SendMessageCommand(
    Guid ChatId,
    Guid SenderId,
    string Content,
    MessageType Type = MessageType.Text
) : IRequest<MessageDto>;
