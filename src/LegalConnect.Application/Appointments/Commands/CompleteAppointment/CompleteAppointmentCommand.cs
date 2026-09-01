using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CompleteAppointment;

public record CompleteAppointmentCommand(Guid AppointmentId) : IRequest;
