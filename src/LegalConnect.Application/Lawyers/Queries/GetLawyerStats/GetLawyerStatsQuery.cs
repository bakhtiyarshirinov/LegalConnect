using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetLawyerStats;

public record GetLawyerStatsQuery(Guid LawyerId) : IRequest<LawyerStatsDto>;
