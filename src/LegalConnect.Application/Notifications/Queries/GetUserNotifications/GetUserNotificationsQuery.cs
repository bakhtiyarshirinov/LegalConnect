using MediatR;

namespace LegalConnect.Application.Notifications.Queries.GetUserNotifications;

public record GetUserNotificationsQuery(Guid UserId)
    : IRequest<IEnumerable<NotificationDto>>;
