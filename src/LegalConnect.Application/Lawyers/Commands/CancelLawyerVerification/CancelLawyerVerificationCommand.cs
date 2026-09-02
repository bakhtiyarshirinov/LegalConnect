using MediatR;

namespace LegalConnect.Application.Lawyers.Commands.CancelLawyerVerification;

/// <summary>
/// Admin action — revokes a lawyer's previously granted verification.
/// <see cref="Reason"/> is mandatory and stored on the lawyer for the audit trail.
/// </summary>
public record CancelLawyerVerificationCommand(Guid LawyerId, string Reason) : IRequest;
