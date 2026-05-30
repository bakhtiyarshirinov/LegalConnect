using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetLawyers;

public class GetLawyersQueryHandler
    : IRequestHandler<GetLawyersQuery, IEnumerable<LawyerDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLawyersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<LawyerDto>> Handle(
        GetLawyersQuery request,
        CancellationToken cancellationToken)
    {
        var lawyers = await _unitOfWork.Lawyers.GetAllAsync(
            city: request.City,
            specializationId: request.SpecializationId,
            maxRate: request.MaxRate
        );

        return lawyers.Select(l => new LawyerDto(
            Id: l.Id,
            FullName: l.User.FullName,
            AvatarUrl: l.User.AvatarUrl,
            City: l.City,
            Bio: l.Bio,
            ExperienceYears: l.ExperienceYears,
            HourlyRate: l.HourlyRate,
            Rating: l.Rating,
            ReviewCount: l.ReviewCount,
            IsVerified: l.IsVerified,
            Specializations: l.Specializations.Select(s => s.Specialization.Name)
        ));
    }
}