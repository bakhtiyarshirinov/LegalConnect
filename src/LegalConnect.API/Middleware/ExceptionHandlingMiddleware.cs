using System.Data.Common;
using System.Net;
using System.Security.Claims;
using System.Text.Json;
using LegalConnect.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (statusCode, message, errors) = ex switch
        {
            ValidationException ve => (
                HttpStatusCode.BadRequest,
                "Validation failed",
                ve.Errors),

            BadRequestException bre => (
                HttpStatusCode.BadRequest,
                bre.Message,
                (IDictionary<string, string[]>?)null),

            ForbiddenAccessException fae => (
                HttpStatusCode.Forbidden,
                fae.Message,
                (IDictionary<string, string[]>?)null),

            // Infrastructure failure — MUST be classified before InvalidOperationException.
            // EF wraps a transient DB outage (connection drop / timeout) in an
            // InvalidOperationException whose inner exception is a DbException, and a failed
            // SaveChanges surfaces as DbUpdateException. Neither is a business conflict — it is
            // a real outage that must reach Error-level logs / alerting, not a routine 409.
            // Handlers that deliberately catch DbUpdateException and translate it into a domain
            // exception run earlier and never reach this arm.
            _ when IsDatabaseFailure(ex) => (
                HttpStatusCode.ServiceUnavailable,
                "Service temporarily unavailable, please try again later.",
                (IDictionary<string, string[]>?)null),

            InvalidOperationException ioe => (
                HttpStatusCode.Conflict,
                ioe.Message,
                (IDictionary<string, string[]>?)null),

            // Do NOT surface knfe.Message — it interpolates ids/emails (data leak).
            // The real message is written to the server log below.
            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                "Resource not found",
                (IDictionary<string, string[]>?)null),


            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                "Invalid credentials",
                (IDictionary<string, string[]>?)null),

            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred",
                (IDictionary<string, string[]>?)null)
        };

        // Log level is driven purely by the mapped status code, never by the client response:
        //   * 4xx — expected/domain outcome (denied IDOR attempt, business conflict, validation,
        //     not-found). Logged as Warning WITHOUT the exception object, so no stack trace floods
        //     the log. A field-only line keeps a spike of 403s visible as a possible attack signal.
        //   * 5xx — the generic catch: an unhandled, unexpected failure. Keep LogError WITH the
        //     exception so the full stack trace is available. This is the only branch that needs
        //     operator attention in production.
        if (statusCode == HttpStatusCode.ServiceUnavailable)
        {
            _logger.LogError(ex, "Database failure on {Path}", context.Request.Path);
        }
        else if ((int)statusCode >= 500)
        {
            _logger.LogError(ex, "Unhandled exception on {Path}", context.Request.Path);
        }
        else
        {
            var userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            _logger.LogWarning(
                "{ExceptionType}: {Message} | Path: {Path} | User: {UserId}",
                ex.GetType().Name, ex.Message, context.Request.Path, userId);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        // Transient by definition — tell the caller it is worth retrying shortly.
        if (statusCode == HttpStatusCode.ServiceUnavailable)
            context.Response.Headers.RetryAfter = "5";

        var response = new
        {
            status = (int)statusCode,
            message,
            errors
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }

    /// <summary>
    /// True when the exception represents a database/infrastructure failure rather than a
    /// business outcome: a failed SaveChanges (<see cref="DbUpdateException"/>, which also
    /// covers <c>DbUpdateConcurrencyException</c>), a raw provider error
    /// (<see cref="DbException"/> — e.g. NpgsqlException: connection reset / timeout), or
    /// EF's transient-failure wrapper (an <see cref="InvalidOperationException"/> whose inner
    /// exception is a <see cref="DbException"/>).
    /// </summary>
    private static bool IsDatabaseFailure(Exception ex) =>
        ex is DbUpdateException
        || ex is DbException
        || (ex is InvalidOperationException && ex.InnerException is DbException);
}