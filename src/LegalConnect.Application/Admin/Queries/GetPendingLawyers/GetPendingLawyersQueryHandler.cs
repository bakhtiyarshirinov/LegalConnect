using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetPendingLawyers;

public class GetPendingLawyersQueryHandler
    : IRequestHandler<GetPendingLawyersQuery, IEnumerable<PendingLawyerDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPendingLawyersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<PendingLawyerDto>> Handle(
        GetPendingLawyersQuery request,
        CancellationToken cancellationToken)
    {
        var lawyers = await _unitOfWork.Lawyers.GetPendingAsync();

        return lawyers.Select(l => new PendingLawyerDto(
            Id: l.Id,
            UserId: l.UserId,
            FullName: l.User.FullName,
            Email: l.User.Email,
            City: l.City,
            LicenseNumber: l.LicenseNumber,
            ExperienceYears: l.ExperienceYears,
            HourlyRate: l.HourlyRate,
            Specializations: l.Specializations.Select(s => s.Specialization.Name)
        ));
    }
}
