using LegalConnect.Domain.Enums;

namespace LegalConnect.Domain.Entities;

public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public string FullName { get; private set; }
    public string? Phone { get; private set; }
    public UserRole Role { get; private set; }
    public string? AvatarUrl { get; private set; }
    public bool IsVerified { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? LastSeen { get; private set; }

    // Navigation properties
    public Lawyer? LawyerProfile { get; private set; }
    public ICollection<Appointment> Appointments { get; private set; } = new List<Appointment>();
    public ICollection<Review> Reviews { get; private set; } = new List<Review>();
    public ICollection<Notification> Notifications { get; private set; } = new List<Notification>();

    private User() { }

    public static User Create(
        string email,
        string passwordHash,
        string fullName,
        UserRole role,
        string? phone = null)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Email = email.ToLower().Trim(),
            PasswordHash = passwordHash,
            FullName = fullName,
            Role = role,
            Phone = phone,
            IsVerified = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void UpdateProfile(string fullName, string? phone, string? avatarUrl = null)
    {
        FullName = fullName;
        Phone = phone;
        if (avatarUrl is not null) AvatarUrl = avatarUrl;
    }

    public void UpdateAvatar(string avatarUrl) => AvatarUrl = avatarUrl;
    public void Verify() => IsVerified = true;
    public void UpdateLastSeen() => LastSeen = DateTime.UtcNow;
    public void UpdatePassword(string passwordHash) => PasswordHash = passwordHash;
}