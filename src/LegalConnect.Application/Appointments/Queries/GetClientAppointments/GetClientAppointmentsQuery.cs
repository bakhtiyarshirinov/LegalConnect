using MediatR;

namespace LegalConnect.Application.Appointments.Queries.GetClientAppointments;

/// <summary>Returns appointments for the authenticated client (identity taken from JWT).</summary>
public record GetClientAppointmentsQuery : IRequest<IEnumerable<AppointmentDto>>;
