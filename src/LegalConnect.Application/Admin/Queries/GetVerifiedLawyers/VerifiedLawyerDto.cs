namespace LegalConnect.Application.Admin.Queries.GetVerifiedLawyers;

public record VerifiedLawyerDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string Email,
    string City,
    string LicenseNumber,
    int ExperienceYears,
    decimal HourlyRate,
    IEnumerable<string> Specializations
);
