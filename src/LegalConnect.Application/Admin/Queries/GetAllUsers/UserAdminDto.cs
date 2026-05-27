namespace LegalConnect.Application.Admin.Queries.GetAllUsers;

public record UserAdminDto(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    bool IsVerified,
    DateTime CreatedAt
);
