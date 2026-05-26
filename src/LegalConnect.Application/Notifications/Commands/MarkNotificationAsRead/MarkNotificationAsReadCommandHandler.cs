using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Notifications.Commands.MarkNotificationAsRead;

public class MarkNotificationAsReadCommandHandler
    : IRequestHandler<MarkNotificationAsReadCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public MarkNotificationAsReadCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(
        MarkNotificationAsReadCommand request,
        CancellationToken cancellationToken)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(request.NotificationId);

        if (notification is null)
            throw new KeyNotFoundException(
                $"Notification with id {request.NotificationId} not found");

        if (notification.UserId != request.UserId)
            throw new InvalidOperationException(
                "You are not authorized to mark this notification as read");

        notification.MarkAsRead();
        _unitOfWork.Notifications.Update(notification);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
