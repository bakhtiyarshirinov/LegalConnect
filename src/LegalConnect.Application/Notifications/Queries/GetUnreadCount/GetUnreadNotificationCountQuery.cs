using MediatR;

namespace LegalConnect.Application.Notifications.Queries.GetUnreadCount;

/// <summary>Unread notification count for the authenticated user (identity from JWT).</summary>
public record GetUnreadNotificationCountQuery : IRequest<int>;
