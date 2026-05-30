using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetLawyers;

public record GetLawyersQuery(
    string? City,
    int? SpecializationId,
    decimal? MaxRate,
    decimal? MinRate,
    int? MinExperience,
    float? MinRating,
    string? SortBy
) : IRequest<IEnumerable<LawyerDto>>;