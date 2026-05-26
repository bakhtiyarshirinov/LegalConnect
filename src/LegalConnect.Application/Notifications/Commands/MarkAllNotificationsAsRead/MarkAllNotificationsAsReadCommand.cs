using MediatR;

namespace LegalConnect.Application.Notifications.Commands.MarkAllNotificationsAsRead;

public record MarkAllNotificationsAsReadCommand(Guid UserId) : IRequest;
