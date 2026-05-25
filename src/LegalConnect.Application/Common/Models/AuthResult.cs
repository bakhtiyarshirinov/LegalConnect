namespace LegalConnect.Application.Common.Models;

public record AuthResult(
    Guid UserId,
    string Email,
    string FullName,
    string Role,
    string Token,
    DateTime ExpiresAt
);