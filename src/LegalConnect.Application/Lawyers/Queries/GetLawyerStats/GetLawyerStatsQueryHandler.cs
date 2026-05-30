using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetLawyerStats;

public class GetLawyerStatsQueryHandler : IRequestHandler<GetLawyerStatsQuery, LawyerStatsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLawyerStatsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<LawyerStatsDto> Handle(GetLawyerStatsQuery request, CancellationToken cancellationToken)
    {
        var appointments = (await _unitOfWork.Appointments.GetByLawyerIdAsync(request.LawyerId)).ToList();
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);

        var completed = appointments.Where(a => a.Status == AppointmentStatus.Completed).ToList();
        var totalClients = appointments.Select(a => a.ClientId).Distinct().Count();
        var totalHoursWorked = completed.Sum(a => a.DurationMinutes) / 60;
        var totalEarned = completed.Sum(a => a.Price);
        var pending = appointments.Count(a => a.Status == AppointmentStatus.Pending);

        return new LawyerStatsDto(
            TotalClients: totalClients,
            TotalAppointments: appointments.Count,
            CompletedAppointments: completed.Count,
            TotalHoursWorked: totalHoursWorked,
            TotalEarned: totalEarned,
            AverageRating: lawyer?.Rating ?? 0,
            ReviewCount: lawyer?.ReviewCount ?? 0,
            PendingAppointments: pending
        );
    }
}
