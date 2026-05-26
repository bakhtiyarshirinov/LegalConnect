using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Notifications.Queries.GetUserNotifications;

public class GetUserNotificationsQueryHandler
    : IRequestHandler<GetUserNotificationsQuery, IEnumerable<NotificationDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUserNotificationsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<NotificationDto>> Handle(
        GetUserNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var notifications = await _unitOfWork.Notifications.GetByUserIdAsync(request.UserId);

        return notifications.Select(n => new NotificationDto(
            Id: n.Id,
            Title: n.Title,
            Body: n.Body,
            Type: n.Type,
            IsRead: n.IsRead,
            CreatedAt: n.CreatedAt));
    }
}
