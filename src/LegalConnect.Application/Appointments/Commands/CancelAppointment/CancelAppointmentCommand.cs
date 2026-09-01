using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CancelAppointment;

public record CancelAppointmentCommand(Guid AppointmentId) : IRequest;
