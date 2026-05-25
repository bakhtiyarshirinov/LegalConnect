using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Lawyers.Commands.UpdateLawyerProfile;

public class UpdateLawyerProfileCommandHandler : IRequestHandler<UpdateLawyerProfileCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateLawyerProfileCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(
        UpdateLawyerProfileCommand request,
        CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByUserIdAsync(request.UserId);

        if (lawyer is null)
            throw new KeyNotFoundException(
                $"Lawyer profile not found for user {request.UserId}");

        lawyer.UpdateProfile(
            bio: request.Bio,
            city: request.City,
            hourlyRate: request.HourlyRate,
            experienceYears: request.ExperienceYears,
            isAvailable: request.IsAvailable
        );

        _unitOfWork.Lawyers.Update(lawyer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
