namespace LegalConnect.Application.Users.Queries.GetCurrentUser;

public record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string? AvatarUrl,
    string Role,
    bool IsVerified,
    DateTime CreatedAt
);
