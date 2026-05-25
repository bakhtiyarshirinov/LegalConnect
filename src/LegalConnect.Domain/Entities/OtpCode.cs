namespace LegalConnect.Domain.Entities;

public class OtpCode
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public bool IsUsed { get; private set; }

    private OtpCode() { }

    public static OtpCode Create(string email, string code)
    {
        return new OtpCode
        {
            Id = Guid.NewGuid(),
            Email = email.ToLower().Trim(),
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false
        };
    }

    public void MarkAsUsed() => IsUsed = true;
}
