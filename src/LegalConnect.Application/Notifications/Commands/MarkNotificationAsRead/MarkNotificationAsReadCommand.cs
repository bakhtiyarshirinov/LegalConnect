using MediatR;

namespace LegalConnect.Application.Notifications.Commands.MarkNotificationAsRead;

public record MarkNotificationAsReadCommand(
    Guid NotificationId,
    Guid UserId
) : IRequest;
