using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetVerifiedLawyers;

public class GetVerifiedLawyersQueryHandler
    : IRequestHandler<GetVerifiedLawyersQuery, IEnumerable<VerifiedLawyerDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetVerifiedLawyersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<VerifiedLawyerDto>> Handle(
        GetVerifiedLawyersQuery request,
        CancellationToken cancellationToken)
    {
        var lawyers = await _unitOfWork.Lawyers.GetVerifiedAsync();

        return lawyers.Select(l => new VerifiedLawyerDto(
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
