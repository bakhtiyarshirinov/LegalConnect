using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetLawyerById;

public class GetLawyerByIdQueryHandler
    : IRequestHandler<GetLawyerByIdQuery, LawyerDetailDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLawyerByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<LawyerDetailDto> Handle(
        GetLawyerByIdQuery request,
        CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);

        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        var isOnline = lawyer.User.LastSeen.HasValue
            && lawyer.User.LastSeen.Value > DateTime.UtcNow.AddMinutes(-5);

        return new LawyerDetailDto(
            Id: lawyer.Id,
            UserId: lawyer.UserId,
            FullName: lawyer.User.FullName,
            Email: lawyer.User.Email,
            Phone: lawyer.User.Phone,
            AvatarUrl: lawyer.User.AvatarUrl,
            City: lawyer.City,
            Bio: lawyer.Bio,
            LicenseNumber: lawyer.LicenseNumber,
            ExperienceYears: lawyer.ExperienceYears,
            HourlyRate: lawyer.HourlyRate,
            Rating: lawyer.Rating,
            ReviewCount: lawyer.ReviewCount,
            IsVerified: lawyer.IsVerified,
            IsAvailable: lawyer.IsAvailable,
            Specializations: lawyer.Specializations.Select(s => s.Specialization.Name),
            SpecializationIds: lawyer.Specializations.Select(s => s.SpecializationId),
            IsOnline: isOnline
        );
    }
}