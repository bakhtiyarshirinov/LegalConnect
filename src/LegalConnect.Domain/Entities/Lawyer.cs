namespace LegalConnect.Domain.Entities;

public class Lawyer
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Bio { get; private set; }
    public string City { get; private set; }
    public string LicenseNumber { get; private set; }
    public int ExperienceYears { get; private set; }
    public decimal HourlyRate { get; private set; }
    public float Rating { get; private set; }
    public int ReviewCount { get; private set; }
    public bool IsVerified { get; private set; }
    public bool IsAvailable { get; private set; }

    // Set when an admin revokes a previously granted verification (see CancelVerification).
    public string? CancellationReason { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    // Navigation properties
    public User User { get; private set; }
    public ICollection<LawyerSpecialization> Specializations { get; private set; } = new List<LawyerSpecialization>();
    public ICollection<Appointment> Appointments { get; private set; } = new List<Appointment>();
    public ICollection<Review> Reviews { get; private set; } = new List<Review>();

    private Lawyer() { }

    public static Lawyer Create(
        Guid userId,
        string bio,
        string city,
        string licenseNumber,
        int experienceYears,
        decimal hourlyRate)
    {
        return new Lawyer
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Bio = bio,
            City = city,
            LicenseNumber = licenseNumber,
            ExperienceYears = experienceYears,
            HourlyRate = hourlyRate,
            Rating = 0,
            ReviewCount = 0,
            IsVerified = false,
            IsAvailable = true
        };
    }

    public void UpdateProfile(
        string bio,
        string city,
        decimal hourlyRate,
        int experienceYears,
        bool isAvailable)
    {
        Bio = bio;
        City = city;
        HourlyRate = hourlyRate;
        ExperienceYears = experienceYears;
        IsAvailable = isAvailable;
    }

    public void UpdateRating(float newRating, int reviewCount)
    {
        Rating = newRating;
        ReviewCount = reviewCount;
    }

    public void SetAvailability(bool isAvailable) => IsAvailable = isAvailable;
    public void Verify() => IsVerified = true;

    /// <summary>
    /// Revokes a verification that was previously granted. The lawyer drops back to the
    /// unverified state (same as never having been verified) and stops appearing in the
    /// public verified-lawyer listings; <paramref name="reason"/> is kept for the audit trail.
    /// </summary>
    public void CancelVerification(string reason)
    {
        IsVerified = false;
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
    }
}