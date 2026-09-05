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
    public string? MeetingUrl { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Set when the appointment is cancelled (by client, lawyer or admin). Unlike
    // Lawyer.CancellationReason this is NOT internal — it is surfaced to the affected
    // party in the cancellation notification and in the appointment history.
    public string? CancellationReason { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    // ─── Reschedule proposal state ───────────────────────────────────────────
    // A reschedule is a REQUEST: ScheduledAt is not touched until the other party
    // accepts. Only one proposal can be pending at a time.
    public DateTime? ProposedScheduledAt { get; private set; }
    public Guid? ProposedByUserId { get; private set; }
    public RescheduleStatus RescheduleStatus { get; private set; } = RescheduleStatus.None;
    public string? RescheduleReason { get; private set; }

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

    /// <summary>
    /// Soft-cancel: the row stays in the database and remains visible in history.
    /// Used by both the "cancel" (reason required) and "delete" (reason optional)
    /// entry points — the distinction lives in the API/validator layer, not here.
    /// </summary>
    public void Cancel(string? reason = null)
    {
        Status = AppointmentStatus.Cancelled;
        CancellationReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        CancelledAt = DateTime.UtcNow;
        ClearReschedule(); // drop any pending proposal
    }
    public void Complete() => Status = AppointmentStatus.Completed;
    public void SetMeetingUrl(string url) => MeetingUrl = url;

    /// <summary>
    /// Records a reschedule proposal. Does NOT change <see cref="ScheduledAt"/> — the
    /// other party must accept first.
    /// </summary>
    public void ProposeReschedule(DateTime proposedAt, Guid byUserId, string? reason)
    {
        ProposedScheduledAt = DateTime.SpecifyKind(proposedAt, DateTimeKind.Utc);
        ProposedByUserId = byUserId;
        RescheduleStatus = RescheduleStatus.Pending;
        RescheduleReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
    }

    /// <summary>Applies a pending proposal: the appointment moves to the proposed time.</summary>
    public void AcceptReschedule()
    {
        if (RescheduleStatus != RescheduleStatus.Pending || ProposedScheduledAt is null)
            throw new InvalidOperationException("No pending reschedule request to accept");

        ScheduledAt = ProposedScheduledAt.Value;
        ClearReschedule();
    }

    /// <summary>Discards a pending proposal; the appointment stays at its current time.</summary>
    public void RejectReschedule() => ClearReschedule();

    private void ClearReschedule()
    {
        ProposedScheduledAt = null;
        ProposedByUserId = null;
        RescheduleStatus = RescheduleStatus.None;
        RescheduleReason = null;
    }
}
