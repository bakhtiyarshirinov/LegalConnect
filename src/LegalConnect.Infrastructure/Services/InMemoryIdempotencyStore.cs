using LegalConnect.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace LegalConnect.Infrastructure.Services;

/// <summary>
/// Single-instance idempotency store backed by <see cref="IMemoryCache"/>.
///
/// Good enough for one API process. For a multi-instance deployment, swap this for a
/// Redis/database implementation of <see cref="IIdempotencyStore"/> — the middleware
/// does not change.
///
/// The per-key <see cref="Gate"/> closes the race window between "started executing"
/// and "cached the result": a second concurrent request with the same key blocks on
/// the semaphore, then finds the freshly stored record instead of executing again.
/// </summary>
public sealed class InMemoryIdempotencyStore : IIdempotencyStore
{
    private const string CachePrefix = "idempotency:";

    private readonly IMemoryCache _cache;

    // One ref-counted gate per in-flight composite key. Always guarded by 'lock (_gates)'.
    private readonly Dictionary<string, Gate> _gates = new();

    public InMemoryIdempotencyStore(IMemoryCache cache) => _cache = cache;

    public Task<IdempotencyRecord?> GetAsync(string compositeKey, CancellationToken cancellationToken = default)
    {
        _cache.TryGetValue(CachePrefix + compositeKey, out IdempotencyRecord? record);
        return Task.FromResult(record);
    }

    public Task SetAsync(
        string compositeKey, IdempotencyRecord record, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        _cache.Set(CachePrefix + compositeKey, record, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl,
        });
        return Task.CompletedTask;
    }

    public async Task<IAsyncDisposable> AcquireLockAsync(
        string compositeKey, CancellationToken cancellationToken = default)
    {
        Gate gate;
        lock (_gates)
        {
            if (!_gates.TryGetValue(compositeKey, out var found))
            {
                found = new Gate();
                _gates[compositeKey] = found;
            }

            found.Refs++;
            gate = found;
        }

        try
        {
            await gate.Semaphore.WaitAsync(cancellationToken);
        }
        catch
        {
            Release(compositeKey, gate, entered: false);
            throw;
        }

        return new Releaser(this, compositeKey, gate);
    }

    private void Release(string compositeKey, Gate gate, bool entered = true)
    {
        lock (_gates)
        {
            if (entered)
                gate.Semaphore.Release();

            if (--gate.Refs == 0)
            {
                _gates.Remove(compositeKey);
                gate.Semaphore.Dispose();
            }
        }
    }

    private sealed class Gate
    {
        public readonly SemaphoreSlim Semaphore = new(1, 1);
        public int Refs;
    }

    private sealed class Releaser : IAsyncDisposable
    {
        private readonly InMemoryIdempotencyStore _store;
        private readonly string _key;
        private readonly Gate _gate;
        private bool _disposed;

        public Releaser(InMemoryIdempotencyStore store, string key, Gate gate)
        {
            _store = store;
            _key = key;
            _gate = gate;
        }

        public ValueTask DisposeAsync()
        {
            if (!_disposed)
            {
                _disposed = true;
                _store.Release(_key, _gate);
            }

            return ValueTask.CompletedTask;
        }
    }
}
