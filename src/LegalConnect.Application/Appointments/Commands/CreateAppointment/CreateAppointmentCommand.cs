using LegalConnect.Domain.Enums;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CreateAppointment;

/// <summary>Client id is taken from the JWT in the handler, never from the request body.</summary>
public record CreateAppointmentCommand(
    Guid LawyerId,
    DateTime ScheduledAt,
    int DurationMinutes,
    AppointmentType Type,
    string? Notes,
    Guid? SlotId = null
) : IRequest<Guid>;
