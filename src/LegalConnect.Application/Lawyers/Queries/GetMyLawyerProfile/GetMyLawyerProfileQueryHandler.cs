using LegalConnect.Application.Lawyers.Queries.GetLawyerById;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetMyLawyerProfile;

public class GetMyLawyerProfileQueryHandler
    : IRequestHandler<GetMyLawyerProfileQuery, LawyerDetailDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMyLawyerProfileQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<LawyerDetailDto> Handle(
        GetMyLawyerProfileQuery request,
        CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByUserIdAsync(request.UserId);

        if (lawyer is null)
            throw new KeyNotFoundException(
                $"Lawyer profile not found for user {request.UserId}");

        // Re-fetch with all navigation props via GetByIdAsync
        var full = await _unitOfWork.Lawyers.GetByIdAsync(lawyer.Id);

        var isOnline = full!.User.LastSeen.HasValue
            && full.User.LastSeen.Value > DateTime.UtcNow.AddMinutes(-5);

        return new LawyerDetailDto(
            Id: full.Id,
            UserId: full.UserId,
            FullName: full.User.FullName,
            City: full.City,
            Bio: full.Bio,
            LicenseNumber: full.LicenseNumber,
            ExperienceYears: full.ExperienceYears,
            HourlyRate: full.HourlyRate,
            Rating: full.Rating,
            ReviewCount: full.ReviewCount,
            IsVerified: full.IsVerified,
            IsAvailable: full.IsAvailable,
            Specializations: full.Specializations.Select(s => s.Specialization.Name),
            IsOnline: isOnline
        );
    }
}
