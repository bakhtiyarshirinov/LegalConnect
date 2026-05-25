using MediatR;

namespace LegalConnect.Application.Lawyers.Commands.UpdateLawyerProfile;

public record UpdateLawyerProfileCommand(
    Guid UserId,
    string Bio,
    string City,
    decimal HourlyRate,
    int ExperienceYears,
    bool IsAvailable
) : IRequest;
