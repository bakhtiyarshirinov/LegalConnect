using LegalConnect.Domain.Enums;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CreateAppointment;

public record CreateAppointmentCommand(
    Guid ClientId,
    Guid LawyerId,
    DateTime ScheduledAt,
    int DurationMinutes,
    AppointmentType Type,
    string? Notes,
    Guid? SlotId = null
) : IRequest<Guid>;
