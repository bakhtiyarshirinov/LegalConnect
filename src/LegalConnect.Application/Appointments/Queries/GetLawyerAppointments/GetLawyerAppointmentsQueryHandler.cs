using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Queries.GetLawyerAppointments;

public class GetLawyerAppointmentsQueryHandler
    : IRequestHandler<GetLawyerAppointmentsQuery, IEnumerable<LawyerAppointmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetLawyerAppointmentsQueryHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<IEnumerable<LawyerAppointmentDto>> Handle(
        GetLawyerAppointmentsQuery request,
        CancellationToken cancellationToken)
    {
        var profile = await _unitOfWork.Lawyers.GetByUserIdAsync(_currentUser.UserId)
            ?? throw new ForbiddenAccessException("Only a lawyer can view lawyer appointments.");

        var appointments = await _unitOfWork.Appointments
            .GetByLawyerIdAsync(profile.Id);

        return appointments.Select(a => new LawyerAppointmentDto(
            Id: a.Id,
            ClientId: a.ClientId,
            ClientFullName: a.Client.FullName,
            ScheduledAt: a.ScheduledAt,
            DurationMinutes: a.DurationMinutes,
            Status: a.Status.ToString(),
            Type: a.Type.ToString(),
            Price: a.Price,
            Notes: a.Notes,
            MeetingUrl: a.MeetingUrl,
            CancellationReason: a.CancellationReason,
            RescheduleStatus: a.RescheduleStatus.ToString(),
            ProposedScheduledAt: a.ProposedScheduledAt,
            ProposedByUserId: a.ProposedByUserId,
            RescheduleReason: a.RescheduleReason));
    }
}
