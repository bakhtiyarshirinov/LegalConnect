using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Queries.GetLawyerAppointments;

public class GetLawyerAppointmentsQueryHandler
    : IRequestHandler<GetLawyerAppointmentsQuery, IEnumerable<LawyerAppointmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLawyerAppointmentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<LawyerAppointmentDto>> Handle(
        GetLawyerAppointmentsQuery request,
        CancellationToken cancellationToken)
    {
        var appointments = await _unitOfWork.Appointments
            .GetByLawyerIdAsync(request.LawyerId);

        return appointments.Select(a => new LawyerAppointmentDto(
            Id: a.Id,
            ClientId: a.ClientId,
            ClientFullName: a.Client.FullName,
            ScheduledAt: a.ScheduledAt,
            DurationMinutes: a.DurationMinutes,
            Status: a.Status.ToString(),
            Type: a.Type.ToString(),
            Price: a.Price,
            Notes: a.Notes));
    }
}
