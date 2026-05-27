using MediatR;

namespace LegalConnect.Application.Appointments.Queries.GetLawyerAppointments;

public record GetLawyerAppointmentsQuery(Guid LawyerId)
    : IRequest<IEnumerable<LawyerAppointmentDto>>;
