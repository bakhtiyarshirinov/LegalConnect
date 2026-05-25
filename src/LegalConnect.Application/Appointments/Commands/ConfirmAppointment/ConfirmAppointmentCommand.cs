using MediatR;

namespace LegalConnect.Application.Appointments.Commands.ConfirmAppointment;

public record ConfirmAppointmentCommand(
    Guid AppointmentId,
    Guid LawyerId
) : IRequest;