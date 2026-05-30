namespace LegalConnect.Application.Lawyers.Queries.GetLawyerById;

public record LawyerDetailDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string? Email,
    string? Phone,
    string? AvatarUrl,
    string City,
    string Bio,
    string LicenseNumber,
    int ExperienceYears,
    decimal HourlyRate,
    float Rating,
    int ReviewCount,
    bool IsVerified,
    bool IsAvailable,
    IEnumerable<string> Specializations,
    IEnumerable<int> SpecializationIds,
    bool IsOnline
);