using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetLawyers;

public record GetLawyersQuery(
    string? City,
    int? SpecializationId,
    decimal? MaxRate
) : IRequest<IEnumerable<LawyerDto>>;