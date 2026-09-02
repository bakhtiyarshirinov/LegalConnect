using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LegalConnect.Application.Common.Interfaces;

namespace LegalConnect.API.Middleware;

/// <summary>
/// General-purpose idempotency for state-changing requests.
///
/// Contract:
///   * Only POST and PUT are considered.
///   * The client opts in per "action attempt" by sending a stable
///     <c>Idempotency-Key</c> header (a GUID generated once by the front-end).
///     No header  → request passes straight through, so existing integrations/tests
///     keep working (opt-in, not mandatory).
///   * The key is partitioned by (caller identity, request path, Idempotency-Key) so the
///     same GUID from two callers or two endpoints never collides. Caller identity is the
///     JWT subject claim when present, otherwise the remote IP.
///   * First execution: the response is forwarded to the client and, <b>only when it is
///     2xx</b>, cached for 24h. 4xx and 5xx are NOT cached — the user can fix the input
///     (or the server can recover) and retry with the same key.
///   * Replay with the same key + identical body  → the cached status/body is returned
///     without hitting the controller or the database.
///   * Replay with the same key but a different body → 422 (key misused by the client).
///   * Concurrent duplicates (a fast double-click) are serialised so only the first runs.
///   * If the store is unavailable / throws, the middleware fails open (request proceeds
///     as if there were no idempotency layer) and logs a warning.
///
/// Registered after UseAuthentication/UseAuthorization (needs the caller claim) and
/// immediately before MapControllers.
/// </summary>
public sealed class IdempotencyMiddleware
{
    private const string HeaderName = "Idempotency-Key";
    private const string ReplayedHeader = "Idempotency-Replayed";
    private const int MaxKeyLength = 200;

    private static readonly TimeSpan Ttl = TimeSpan.FromHours(24);

    /// <summary>Responses larger than this are still streamed to the client but not cached (point 6).</summary>
    private const long MaxCacheableResponseBytes = 256 * 1024;

    /// <summary>Request bodies larger than this skip idempotency entirely (uploads / streamed bodies).</summary>
    private const long MaxHashableRequestBytes = 1024 * 1024;

    /// <summary>
    /// Paths never covered by generic idempotency.
    ///   /hubs/**      — SignalR, no plain HTTP POST/PUT here.
    ///   /api/auth/**  — OTP/login already have their own replay / attempt limiting (Phase 3).
    ///   /api/files/** — multipart uploads / streamed bodies, must not be buffered or cached.
    /// </summary>
    private static readonly string[] DenyPrefixes =
    {
        "/hubs",
        "/api/auth",
        "/api/files",
    };

    private readonly RequestDelegate _next;
    private readonly IIdempotencyStore _store;
    private readonly ILogger<IdempotencyMiddleware> _logger;

    public IdempotencyMiddleware(
        RequestDelegate next,
        IIdempotencyStore store,
        ILogger<IdempotencyMiddleware> logger)
    {
        _next = next;
        _store = store;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!ShouldHandle(context.Request))
        {
            await _next(context);
            return;
        }

        var idempotencyKey = context.Request.Headers[HeaderName].ToString();
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            await _next(context);
            return;
        }

        if (idempotencyKey.Length > MaxKeyLength)
        {
            await WriteJsonAsync(context, StatusCodes.Status422UnprocessableEntity, "Idempotency-Key is too long");
            return;
        }

        // Oversized / streamed request bodies are not buffered or hashed.
        if (context.Request.ContentLength is > MaxHashableRequestBytes)
        {
            await _next(context);
            return;
        }

        var ct = context.RequestAborted;
        var requestHash = await ComputeRequestHashAsync(context.Request, ct);
        var compositeKey = BuildCompositeKey(context, idempotencyKey);

        IAsyncDisposable? gate = null;
        IdempotencyRecord? existing;

        try
        {
            existing = await _store.GetAsync(compositeKey, ct);
            if (existing is null)
            {
                gate = await _store.AcquireLockAsync(compositeKey, ct);
                existing = await _store.GetAsync(compositeKey, ct); // re-check under the lock
            }
        }
        catch (Exception ex)
        {
            // Fail open — the idempotency layer must never take the endpoint down.
            _logger.LogWarning(ex,
                "Idempotency store unavailable for {Method} {Path}; proceeding without idempotency",
                context.Request.Method, context.Request.Path);

            if (gate is not null)
                await gate.DisposeAsync();

            await _next(context);
            return;
        }

        try
        {
            if (existing is not null)
            {
                if (string.Equals(existing.RequestHash, requestHash, StringComparison.Ordinal))
                    await ReplayAsync(context, existing, ct);
                else
                    await WriteJsonAsync(context, StatusCodes.Status422UnprocessableEntity,
                        "Idempotency-Key reuse with different request body");
                return;
            }

            await ExecuteAndCaptureAsync(context, compositeKey, requestHash, ct);
        }
        finally
        {
            if (gate is not null)
                await gate.DisposeAsync();
        }
    }

    private static bool ShouldHandle(HttpRequest request)
    {
        if (!HttpMethods.IsPost(request.Method) && !HttpMethods.IsPut(request.Method))
            return false;

        foreach (var prefix in DenyPrefixes)
            if (request.Path.StartsWithSegments(prefix, StringComparison.OrdinalIgnoreCase))
                return false;

        return true;
    }

    private static async Task<string> ComputeRequestHashAsync(HttpRequest request, CancellationToken ct)
    {
        request.EnableBuffering();

        using var ms = new MemoryStream();
        await request.Body.CopyToAsync(ms, ct);
        request.Body.Position = 0; // rewind so model binding still sees the body

        return Convert.ToHexString(SHA256.HashData(ms.ToArray()));
    }

    private static string BuildCompositeKey(HttpContext context, string idempotencyKey)
    {
        var caller =
            context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        var raw = $"{caller}|{context.Request.Path.Value}|{idempotencyKey}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
    }

    private static async Task ReplayAsync(HttpContext context, IdempotencyRecord record, CancellationToken ct)
    {
        context.Response.StatusCode = record.StatusCode;
        if (!string.IsNullOrEmpty(record.ContentType))
            context.Response.ContentType = record.ContentType;
        context.Response.Headers[ReplayedHeader] = "true";

        await context.Response.Body.WriteAsync(record.Body, ct);
    }

    private async Task ExecuteAndCaptureAsync(
        HttpContext context, string compositeKey, string requestHash, CancellationToken ct)
    {
        var originalBody = context.Response.Body;
        using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        try
        {
            await _next(context);
        }
        finally
        {
            context.Response.Body = originalBody;
        }

        buffer.Position = 0;
        await buffer.CopyToAsync(originalBody, ct); // forward the real bytes to the client

        var status = context.Response.StatusCode;
        var cacheable = status is >= 200 and <= 299 && buffer.Length <= MaxCacheableResponseBytes;
        if (!cacheable)
            return;

        var record = new IdempotencyRecord(
            status,
            context.Response.ContentType,
            buffer.ToArray(),
            requestHash,
            DateTimeOffset.UtcNow);

        try
        {
            await _store.SetAsync(compositeKey, record, Ttl, ct);
        }
        catch (Exception ex)
        {
            // Non-fatal: the client already has its response; a later retry just re-executes.
            _logger.LogWarning(ex, "Failed to store idempotency record for {Path}", context.Request.Path);
        }
    }

    private static Task WriteJsonAsync(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var json = JsonSerializer.Serialize(
            new { status = statusCode, message, errors = (object?)null },
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        return context.Response.WriteAsync(json);
    }
}
