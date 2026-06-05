using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Queries.GetClientAppointments;

public class GetClientAppointmentsQueryHandler
    : IRequestHandler<GetClientAppointmentsQuery, IEnumerable<AppointmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetClientAppointmentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<AppointmentDto>> Handle(
        GetClientAppointmentsQuery request,
        CancellationToken cancellationToken)
    {
        var appointments = await _unitOfWork.Appointments
            .GetByClientIdAsync(request.ClientId);

        return appointments.Select(a => new AppointmentDto(
            Id: a.Id,
            LawyerId: a.LawyerId,
            LawyerFullName: a.Lawyer.User.FullName,
            ScheduledAt: a.ScheduledAt,
            DurationMinutes: a.DurationMinutes,
            Status: a.Status.ToString(),
            Type: a.Type.ToString(),
            Price: a.Price,
            Notes: a.Notes,
            MeetingUrl: a.MeetingUrl
        ));
    }
}