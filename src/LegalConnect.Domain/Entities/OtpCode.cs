namespace LegalConnect.Domain.Entities;

public class OtpCode
{
    /// <summary>Wrong-guess attempts allowed before the code is burned.</summary>
    public const int MaxAttempts = 5;

    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public bool IsUsed { get; private set; }
    public int FailedAttempts { get; private set; }

    private OtpCode() { }

    public static OtpCode Create(string email, string code)
    {
        return new OtpCode
        {
            Id = Guid.NewGuid(),
            Email = email.ToLower().Trim(),
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false,
            FailedAttempts = 0
        };
    }

    public bool IsExhausted => FailedAttempts >= MaxAttempts;

    public void MarkAsUsed() => IsUsed = true;

    /// <summary>Records a wrong guess. The code is burned once the attempt limit is reached.</summary>
    public void RegisterFailedAttempt()
    {
        FailedAttempts++;
        if (FailedAttempts >= MaxAttempts)
            IsUsed = true;
    }
}
