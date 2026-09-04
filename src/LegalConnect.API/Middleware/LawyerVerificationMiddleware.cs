using System.Security.Claims;
using System.Text.Json;
using LegalConnect.Domain.Interfaces;

namespace LegalConnect.API.Middleware;

/// <summary>
/// Read-only lockout for a lawyer whose verification was revoked by an admin
/// (Lawyer.IsVerified == false — the single source of truth, see BUG-01).
///
/// Such a lawyer may still authenticate and READ their own data (GET requests,
/// so the portal can render past appointments / schedule with a "verification
/// revoked" banner), but every state-changing action as a lawyer is refused with
/// HTTP 403 and <c>code = "lawyer_verification_revoked"</c>.
///
/// Anonymous requests, non-lawyer roles, and verified lawyers pass straight through.
/// Runs after UseAuthentication/UseAuthorization and after EmailVerificationMiddleware.
/// </summary>
public class LawyerVerificationMiddleware
{
    private readonly RequestDelegate _next;

    public LawyerVerificationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IUnitOfWork unitOfWork)
    {
        var user = context.User;
        var isLawyer = user?.Identity?.IsAuthenticated == true
            && string.Equals(user.FindFirstValue(ClaimTypes.Role), "Lawyer", StringComparison.Ordinal);

        if (!isLawyer || IsAlwaysAllowed(context.Request))
        {
            await _next(context);
            return;
        }

        var rawId = user!.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(rawId, out var userId))
        {
            await _next(context);
            return;
        }

        var lawyer = await unitOfWork.Lawyers.GetByUserIdAsync(userId);

        // No profile yet, or still verified → nothing to restrict.
        if (lawyer is null || lawyer.IsVerified)
        {
            await _next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";

        var payload = JsonSerializer.Serialize(new
        {
            status = StatusCodes.Status403Forbidden,
            message = "Your lawyer verification has been revoked. Access is read-only until an admin re-verifies your account.",
            code = "lawyer_verification_revoked",
            errors = (object?)null
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        await context.Response.WriteAsync(payload);
    }

    /// <summary>
    /// Requests a revoked lawyer is still allowed to make:
    ///   * any safe method (GET/HEAD/OPTIONS) — read-only portal access
    ///   * the auth flows
    ///   * marking notifications read (view-state only, not a lawyer action)
    /// </summary>
    private static bool IsAlwaysAllowed(HttpRequest request)
    {
        if (HttpMethods.IsGet(request.Method)
            || HttpMethods.IsHead(request.Method)
            || HttpMethods.IsOptions(request.Method))
            return true;

        var path = request.Path;

        if (path.StartsWithSegments("/api/auth", StringComparison.OrdinalIgnoreCase))
            return true;

        if (path.StartsWithSegments("/api/notifications", StringComparison.OrdinalIgnoreCase)
            && (path.Value!.EndsWith("/read", StringComparison.OrdinalIgnoreCase)
                || path.Value!.EndsWith("/read-all", StringComparison.OrdinalIgnoreCase)))
            return true;

        return false;
    }
}
