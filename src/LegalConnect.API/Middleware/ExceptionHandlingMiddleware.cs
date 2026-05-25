using System.Net;
using System.Text.Json;
using LegalConnect.Application.Common.Exceptions;

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

            InvalidOperationException ioe => (
                HttpStatusCode.Conflict,
                ioe.Message,
                (IDictionary<string, string[]>?)null),
            
            KeyNotFoundException knfe => (
                HttpStatusCode.NotFound,
                knfe.Message,
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

        _logger.LogError(ex, "Exception caught: {Message}", ex.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

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
}