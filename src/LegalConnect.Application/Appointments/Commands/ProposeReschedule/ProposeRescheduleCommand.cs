using MediatR;

namespace LegalConnect.Application.Appointments.Commands.ProposeReschedule;

/// <summary>
/// A participant (client or lawyer) proposes a new time for an appointment.
/// This does NOT move the appointment — the other party must accept via
/// RespondRescheduleCommand.
/// </summary>
public record ProposeRescheduleCommand(
    Guid AppointmentId,
    DateTime NewScheduledAt,
    string? Reason
) : IRequest;
