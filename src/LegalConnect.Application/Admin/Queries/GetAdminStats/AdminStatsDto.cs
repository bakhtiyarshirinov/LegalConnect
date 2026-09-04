namespace LegalConnect.Application.Admin.Queries.GetAdminStats;

public record AdminStatsDto(
    int TotalUsers,
    int VerifiedLawyers,
    int PendingApprovals
);
