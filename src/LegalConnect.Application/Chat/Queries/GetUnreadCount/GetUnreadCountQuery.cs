using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetUnreadCount;

/// <summary>Unread message count for the authenticated user (identity from JWT).</summary>
public record GetUnreadCountQuery : IRequest<int>;
