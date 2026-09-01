using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Notifications.Queries.GetUserNotifications;

public class GetUserNotificationsQueryHandler
    : IRequestHandler<GetUserNotificationsQuery, IEnumerable<NotificationDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetUserNotificationsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<IEnumerable<NotificationDto>> Handle(
        GetUserNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var notifications = await _unitOfWork.Notifications.GetByUserIdAsync(_currentUser.UserId);

        return notifications.Select(n => new NotificationDto(
            Id: n.Id,
            Title: n.Title,
            Body: n.Body,
            Type: n.Type,
            IsRead: n.IsRead,
            CreatedAt: n.CreatedAt));
    }
}
