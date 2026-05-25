using MediatR;

namespace LegalConnect.Application.Lawyers.Commands.CreateLawyerProfile;

public record CreateLawyerProfileCommand(
    Guid UserId,
    string Bio,
    string City,
    string LicenseNumber,
    int ExperienceYears,
    decimal HourlyRate,
    IEnumerable<int> SpecializationIds
) : IRequest<Guid>;