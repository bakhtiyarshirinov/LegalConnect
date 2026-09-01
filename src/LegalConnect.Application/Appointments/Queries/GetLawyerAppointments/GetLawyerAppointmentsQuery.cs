using MediatR;

namespace LegalConnect.Application.Appointments.Queries.GetLawyerAppointments;

/// <summary>Returns appointments for the authenticated lawyer (identity taken from JWT).</summary>
public record GetLawyerAppointmentsQuery : IRequest<IEnumerable<LawyerAppointmentDto>>;
