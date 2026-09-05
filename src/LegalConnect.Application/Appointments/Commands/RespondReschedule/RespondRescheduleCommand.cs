using MediatR;

namespace LegalConnect.Application.Appointments.Commands.RespondReschedule;

/// <summary>
/// The OTHER party (not the proposer) accepts or rejects a pending reschedule proposal.
/// </summary>
public record RespondRescheduleCommand(
    Guid AppointmentId,
    bool Accept,
    string? Reason
) : IRequest;
