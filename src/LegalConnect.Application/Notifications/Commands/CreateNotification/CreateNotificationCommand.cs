using MediatR;

namespace LegalConnect.Application.Notifications.Commands.CreateNotification;

/// <summary>
/// Internal command — called from other handlers to create a notification.
/// </summary>
public record CreateNotificationCommand(
    Guid UserId,
    string Title,
    string Body,
    string Type
) : IRequest<Guid>;
