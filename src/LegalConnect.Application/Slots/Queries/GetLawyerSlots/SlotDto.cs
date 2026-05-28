namespace LegalConnect.Application.Slots.Queries.GetLawyerSlots;

public record SlotDto(
    Guid Id,
    DateTime StartTime,
    DateTime EndTime,
    bool IsBooked,
    int DurationMinutes
);
