namespace LegalConnect.Application.Notifications.Queries.GetUserNotifications;

public record NotificationDto(
    Guid Id,
    string Title,
    string Body,
    string Type,
    bool IsRead,
    DateTime CreatedAt
);
