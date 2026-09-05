namespace LegalConnect.Domain.Entities;

public class AvailabilitySlot
{
    public Guid Id { get; private set; }
    public Guid LawyerId { get; private set; }
    public DateTime StartTime { get; private set; }
    public DateTime EndTime { get; private set; }
    public bool IsBooked { get; private set; }
    public Guid? AppointmentId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public Lawyer Lawyer { get; private set; } = null!;

    private AvailabilitySlot() { }

    public static AvailabilitySlot Create(Guid lawyerId, DateTime startTime, DateTime endTime)
    {
        return new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            LawyerId = lawyerId,
            StartTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc),
            EndTime = DateTime.SpecifyKind(endTime, DateTimeKind.Utc),
            IsBooked = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Book(Guid appointmentId)
    {
        IsBooked = true;
        AppointmentId = appointmentId;
    }

    public void Unbook()
    {
        IsBooked = false;
        AppointmentId = null;
    }

    /// <summary>
    /// Moves a free slot to a new time range (drag-and-drop / quick edit in Cədvəl).
    /// Callers must reject this for a booked slot before calling — see MoveSlotCommandHandler.
    /// </summary>
    public void Reschedule(DateTime startTime, DateTime endTime)
    {
        StartTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc);
        EndTime = DateTime.SpecifyKind(endTime, DateTimeKind.Utc);
    }
}
