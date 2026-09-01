using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Domain.Enums;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.SendMessage;

/// <summary>Sender id is taken from the JWT in the handler, never from the request body.</summary>
public record SendMessageCommand(
    Guid ChatId,
    string Content,
    MessageType Type = MessageType.Text
) : IRequest<MessageDto>;
