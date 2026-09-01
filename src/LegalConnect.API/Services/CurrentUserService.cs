using System.Security.Claims;
using LegalConnect.Application.Common.Interfaces;

namespace LegalConnect.API.Services;

/// <summary>
/// Reads caller identity from the validated JWT on the current HTTP request.
/// </summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserIdOrDefault
    {
        get
        {
            var raw = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(raw, out var id))
                return id;

            // Non-HTTP entry points (SignalR hub) set an ambient identity from the
            // connection's authenticated JWT — used only when there is no HttpContext.
            return AmbientUserContext.CurrentUserId;
        }
    }

    public Guid UserId =>
        UserIdOrDefault ?? throw new UnauthorizedAccessException("User is not authenticated.");

    public string? Role => User?.FindFirstValue(ClaimTypes.Role);

    public bool IsEmailVerified =>
        string.Equals(User?.FindFirstValue("email_verified"), "true", StringComparison.OrdinalIgnoreCase);

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public bool IsInRole(string role) => User?.IsInRole(role) == true;
}
