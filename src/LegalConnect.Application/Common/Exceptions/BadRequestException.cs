namespace LegalConnect.Application.Common.Exceptions;

/// <summary>
/// Thrown for a semantically invalid request that FluentValidation cannot express
/// (e.g. a cross-entity mismatch checked against the database). Maps to HTTP 400.
/// </summary>
public class BadRequestException : Exception
{
    public BadRequestException(string message) : base(message) { }
}
