namespace LegalConnect.Application.Common.Interfaces;

/// <summary>
/// Ambient information about the currently authenticated caller.
/// Populated from the JWT — never from request query string or body.
/// Handlers must use this as the single source of truth for "who am I".
/// </summary>
public interface ICurrentUserService
{
    /// <summary>Authenticated user id. Throws <see cref="UnauthorizedAccessException"/> if the request is anonymous.</summary>
    Guid UserId { get; }

    /// <summary>Authenticated user id, or <c>null</c> for anonymous requests.</summary>
    Guid? UserIdOrDefault { get; }

    /// <summary>Role claim value ("Client" / "Lawyer" / "Admin"), or <c>null</c>.</summary>
    string? Role { get; }

    /// <summary>True when the caller's e-mail has been confirmed via OTP (from the JWT claim).</summary>
    bool IsEmailVerified { get; }

    bool IsAuthenticated { get; }

    bool IsInRole(string role);
}
