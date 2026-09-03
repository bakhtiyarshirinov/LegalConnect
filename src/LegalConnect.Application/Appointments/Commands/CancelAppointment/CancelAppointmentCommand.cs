using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CancelAppointment;

/// <summary>
/// Soft-cancels an appointment (status → Cancelled, row kept for history).
/// Backs two entry points that share this one handler:
///   * PUT /api/appointments/{id}/cancel  — "cancel" (4.2), <see cref="RequireReason"/> = true,
///     <see cref="Reason"/> mandatory (min 10 chars).
///   * DELETE /api/appointments/{id}      — "delete" (4.1), <see cref="RequireReason"/> = false,
///     <see cref="Reason"/> optional.
/// </summary>
public record CancelAppointmentCommand(
    Guid AppointmentId,
    string? Reason = null,
    bool RequireReason = false) : IRequest;
