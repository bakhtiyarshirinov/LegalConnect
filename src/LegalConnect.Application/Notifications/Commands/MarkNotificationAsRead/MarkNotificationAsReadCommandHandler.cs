using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Notifications.Commands.MarkNotificationAsRead;

public class MarkNotificationAsReadCommandHandler
    : IRequestHandler<MarkNotificationAsReadCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public MarkNotificationAsReadCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task Handle(
        MarkNotificationAsReadCommand request,
        CancellationToken cancellationToken)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(request.NotificationId);

        if (notification is null)
            throw new KeyNotFoundException(
                $"Notification with id {request.NotificationId} not found");

        if (notification.UserId != _currentUser.UserId)
            throw new ForbiddenAccessException("You cannot modify another user's notification.");

        notification.MarkAsRead();
        _unitOfWork.Notifications.Update(notification);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
