namespace LegalConnect.Application.Appointments.Queries.GetClientAppointments;

public record AppointmentDto(
    Guid Id,
    Guid LawyerId,
    string LawyerFullName,
    DateTime ScheduledAt,
    int DurationMinutes,
    string Status,
    string Type,
    decimal Price,
    string? Notes,
    string? MeetingUrl
);