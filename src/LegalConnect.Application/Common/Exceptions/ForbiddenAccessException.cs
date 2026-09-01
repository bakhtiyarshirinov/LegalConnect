namespace LegalConnect.Application.Common.Exceptions;

/// <summary>
/// Thrown when the caller is authenticated but not allowed to act on the target resource.
/// Maps to HTTP 403.
/// </summary>
public class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException()
        : base("You are not allowed to perform this action.") { }

    public ForbiddenAccessException(string message)
        : base(message) { }
}
