using LegalConnect.Domain.Enums;

namespace LegalConnect.Domain.Entities;

public class Appointment
{
    public Guid Id { get; private set; }
    public Guid ClientId { get; private set; }
    public Guid LawyerId { get; private set; }
    public Guid? SlotId { get; private set; }
    public DateTime ScheduledAt { get; private set; }
    public int DurationMinutes { get; private set; }
    public AppointmentStatus Status { get; private set; }
    public AppointmentType Type { get; private set; }
    public string? Notes { get; private set; }
    public decimal Price { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public User Client { get; private set; } = null!;
    public Lawyer Lawyer { get; private set; } = null!;
    public Review? Review { get; private set; }

    private Appointment() { }

    public static Appointment Create(
        Guid clientId,
        Guid lawyerId,
        DateTime scheduledAt,
        int durationMinutes,
        AppointmentType type,
        decimal price,
        string? notes = null,
        Guid? slotId = null)
    {
        return new Appointment
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            LawyerId = lawyerId,
            SlotId = slotId,
            ScheduledAt = scheduledAt,
            DurationMinutes = durationMinutes,
            Status = AppointmentStatus.Pending,
            Type = type,
            Price = price,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Confirm() => Status = AppointmentStatus.Confirmed;
    public void Cancel() => Status = AppointmentStatus.Cancelled;
    public void Complete() => Status = AppointmentStatus.Completed;
}
