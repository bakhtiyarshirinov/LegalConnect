using MediatR;

namespace LegalConnect.Application.Notifications.Queries.GetUnreadCount;

public record GetUnreadNotificationCountQuery(Guid UserId)
    : IRequest<int>;
