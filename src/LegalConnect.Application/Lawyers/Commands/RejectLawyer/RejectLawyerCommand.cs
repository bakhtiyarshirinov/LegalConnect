using MediatR;

namespace LegalConnect.Application.Lawyers.Commands.RejectLawyer;

/// <summary>
/// Admin action — rejects a lawyer's pending verification application.
/// <see cref="Reason"/> is mandatory (min 10 chars), stored on the lawyer and sent
/// to them as a notification. Mirrors CancelLawyerVerificationCommand.
/// </summary>
public record RejectLawyerCommand(Guid LawyerId, string Reason) : IRequest;
