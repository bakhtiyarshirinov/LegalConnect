namespace LegalConnect.Application.Common.Interfaces;

/// <summary>
/// Fallback caller identity for non-HTTP entry points (e.g. SignalR hub invocations)
/// where <see cref="Microsoft.AspNetCore.Http.HttpContext"/> is not available.
///
/// The value is set by a trusted server-side caller that has already authenticated the
/// user (the hub reads it from the connection's JWT), never from client-supplied data.
/// HTTP requests ignore this and always use the request's JWT.
/// </summary>
public static class AmbientUserContext
{
    private static readonly AsyncLocal<Guid?> _current = new();

    public static Guid? CurrentUserId => _current.Value;

    public static IDisposable BeginScope(Guid userId)
    {
        var previous = _current.Value;
        _current.Value = userId;
        return new Restore(previous);
    }

    private sealed class Restore : IDisposable
    {
        private readonly Guid? _previous;
        public Restore(Guid? previous) => _previous = previous;
        public void Dispose() => _current.Value = _previous;
    }
}
