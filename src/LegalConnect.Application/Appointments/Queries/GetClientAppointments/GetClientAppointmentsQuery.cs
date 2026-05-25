using MediatR;

namespace LegalConnect.Application.Appointments.Queries.GetClientAppointments;

public record GetClientAppointmentsQuery(Guid ClientId)
    : IRequest<IEnumerable<AppointmentDto>>;