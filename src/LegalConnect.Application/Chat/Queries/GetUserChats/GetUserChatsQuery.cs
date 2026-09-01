using LegalConnect.Application.Chat.DTOs;
using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetUserChats;

/// <summary>Chats of the authenticated user (identity from JWT).</summary>
public record GetUserChatsQuery : IRequest<IEnumerable<ChatDto>>;
