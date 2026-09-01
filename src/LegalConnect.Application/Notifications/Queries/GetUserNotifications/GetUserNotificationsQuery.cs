using MediatR;

namespace LegalConnect.Application.Notifications.Queries.GetUserNotifications;

/// <summary>Notifications of the authenticated user (identity from JWT).</summary>
public record GetUserNotificationsQuery : IRequest<IEnumerable<NotificationDto>>;
