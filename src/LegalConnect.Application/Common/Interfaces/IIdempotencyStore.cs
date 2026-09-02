namespace LegalConnect.Application.Common.Interfaces;

/// <summary>
/// Cached outcome of the first execution of an idempotent (POST/PUT) request.
/// </summary>
public sealed record IdempotencyRecord(
    int StatusCode,
    string? ContentType,
    byte[] Body,
    string RequestHash,
    DateTimeOffset CreatedAt);

/// <summary>
/// Storage for idempotency keys and their first-execution responses.
///
/// The starter implementation is in-memory (single instance). The contract is kept
/// deliberately small — Get / Set / AcquireLock — so a Redis- or database-backed store
/// can replace it without touching <c>IdempotencyMiddleware</c>:
///   * <see cref="GetAsync"/>         → GET key
///   * <see cref="SetAsync"/>         → SET key value EX 86400
///   * <see cref="AcquireLockAsync"/> → SET lock:key token NX PX ... (blocking wrapper)
/// </summary>
public interface IIdempotencyStore
{
    /// <summary>Stored response for <paramref name="compositeKey"/>, or <c>null</c> if none.</summary>
    Task<IdempotencyRecord?> GetAsync(string compositeKey, CancellationToken cancellationToken = default);

    /// <summary>Persist <paramref name="record"/> under <paramref name="compositeKey"/> for <paramref name="ttl"/>.</summary>
    Task SetAsync(string compositeKey, IdempotencyRecord record, TimeSpan ttl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Serialise concurrent requests that share <paramref name="compositeKey"/> so the second
    /// caller waits for the first to finish (and populate the store) instead of racing it.
    /// Dispose the returned handle to release.
    /// </summary>
    Task<IAsyncDisposable> AcquireLockAsync(string compositeKey, CancellationToken cancellationToken = default);
}
