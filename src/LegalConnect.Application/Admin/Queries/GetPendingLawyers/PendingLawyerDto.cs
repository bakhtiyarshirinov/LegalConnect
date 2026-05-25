namespace LegalConnect.Application.Admin.Queries.GetPendingLawyers;

public record PendingLawyerDto(
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
