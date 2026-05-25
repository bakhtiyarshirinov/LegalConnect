using LegalConnect.Application.Chat.DTOs;
using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetChatMessages;

public record GetChatMessagesQuery(Guid ChatId) : IRequest<IEnumerable<MessageDto>>;
