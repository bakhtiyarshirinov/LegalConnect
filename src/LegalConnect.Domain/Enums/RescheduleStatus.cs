namespace LegalConnect.Domain.Enums;

/// <summary>State of a pending reschedule proposal on an appointment.</summary>
public enum RescheduleStatus
{
    None = 0,
    Pending = 1,
    Accepted = 2,
    Rejected = 3
}
