namespace LegalConnect.Application.Lawyers.Queries.GetLawyerStats;

public record LawyerStatsDto(
    int TotalClients,
    int TotalAppointments,
    int CompletedAppointments,
    int TotalHoursWorked,
    decimal TotalEarned,
    float AverageRating,
    int ReviewCount,
    int PendingAppointments
);
