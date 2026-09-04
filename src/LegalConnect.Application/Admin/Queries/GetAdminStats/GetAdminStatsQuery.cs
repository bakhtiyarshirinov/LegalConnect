using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetAdminStats;

/// <summary>Admin-only: aggregate counts for the admin dashboard cards.</summary>
public record GetAdminStatsQuery : IRequest<AdminStatsDto>;
