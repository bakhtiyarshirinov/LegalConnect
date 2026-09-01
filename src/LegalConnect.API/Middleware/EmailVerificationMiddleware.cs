using System.Security.Claims;
using System.Text.Json;

namespace LegalConnect.API.Middleware;

/// <summary>
/// Blocks authenticated-but-unverified users from acting on the platform.
/// An unverified JWT is accepted only for a small allow-list (OTP verification,
/// OTP resend, and reading one's own profile); every other authenticated route
/// returns HTTP 403 until the e-mail is confirmed.
///
/// Anonymous requests are untouched — authentication/authorization handle those.
/// </summary>
public class EmailVerificationMiddleware
{
    private readonly RequestDelegate _next;

    public EmailVerificationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var user = context.User;

        if (user?.Identity?.IsAuthenticated == true && !IsEmailVerified(user) && !IsAllowedWhileUnverified(context.Request))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";

            var payload = JsonSerializer.Serialize(new
            {
                status = StatusCodes.Status403Forbidden,
                message = "E-mail not verified. Confirm your e-mail with the OTP code to continue.",
                errors = (object?)null
            }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

            await context.Response.WriteAsync(payload);
            return;
        }

        await _next(context);
    }

    private static bool IsEmailVerified(ClaimsPrincipal user) =>
        string.Equals(user.FindFirstValue("email_verified"), "true", StringComparison.OrdinalIgnoreCase);

    private static bool IsAllowedWhileUnverified(HttpRequest request)
    {
        var path = request.Path;

        // Auth flows (verify-otp, resend-otp, login, forgot/reset-password, register…)
        if (path.StartsWithSegments("/api/auth", StringComparison.OrdinalIgnoreCase))
            return true;

        // Read own profile so the client can show "please verify" UI
        if (HttpMethods.IsGet(request.Method) &&
            path.Equals("/api/users/me", StringComparison.OrdinalIgnoreCase))
            return true;

        // Non-API paths (openapi/scalar/static) are not gated here
        if (!path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }
}
