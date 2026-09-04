namespace LegalConnect.Application.Admin.Queries.GetUserProfile;

public record UserProfileDto(
    Guid Id,
    string FullName,
    string Email,
    string? Phone,
    string Role,
    bool IsVerified,
    DateTime CreatedAt,
    DateTime? LastSeen,
    string? AvatarUrl,
    LawyerProfileInfo? Lawyer,
    ActivitySummary Activity
);

/// <summary>Lawyer-specific block; null for non-lawyer users.</summary>
public record LawyerProfileInfo(
    Guid LawyerId,
    string City,
    string LicenseNumber,
    int ExperienceYears,
    decimal HourlyRate,
    float Rating,
    int ReviewCount,
    bool IsVerified,
    bool IsAvailable,
    IEnumerable<string> Specializations,
    // Set when an admin revoked a previously granted verification (Phase 6.1).
    string? CancellationReason,
    DateTime? CancelledAt,
    // Set when an admin rejected the pending verification application.
    string? RejectionReason,
    DateTime? RejectedAt
);

/// <summary>Appointment activity roll-up. For a lawyer — their appointments; for a client — theirs.</summary>
public record ActivitySummary(
    int TotalAppointments,
    int PendingAppointments,
    int ConfirmedAppointments,
    int CompletedAppointments,
    int CancelledAppointments
);
