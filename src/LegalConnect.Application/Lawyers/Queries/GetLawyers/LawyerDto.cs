namespace LegalConnect.Application.Lawyers.Queries.GetLawyers;

public record LawyerDto(
    Guid Id,
    string FullName,
    string City,
    string Bio,
    int ExperienceYears,
    decimal HourlyRate,
    float Rating,
    int ReviewCount,
    bool IsVerified,
    IEnumerable<string> Specializations
);