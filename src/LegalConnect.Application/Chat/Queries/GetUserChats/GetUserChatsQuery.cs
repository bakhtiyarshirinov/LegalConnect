using LegalConnect.Application.Chat.DTOs;
using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetUserChats;

public record GetUserChatsQuery(Guid UserId) : IRequest<IEnumerable<ChatDto>>;
