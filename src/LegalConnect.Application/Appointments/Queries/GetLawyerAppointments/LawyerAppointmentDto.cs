namespace LegalConnect.Application.Appointments.Queries.GetLawyerAppointments;

public record LawyerAppointmentDto(
    Guid Id,
    Guid ClientId,
    string ClientFullName,
    DateTime ScheduledAt,
    int DurationMinutes,
    string Status,
    string Type,
    decimal Price,
    string? Notes
);
