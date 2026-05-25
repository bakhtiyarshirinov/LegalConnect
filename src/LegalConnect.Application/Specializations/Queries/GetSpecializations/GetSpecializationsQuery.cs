using MediatR;

namespace LegalConnect.Application.Specializations.Queries.GetSpecializations;

public record GetSpecializationsQuery : IRequest<IEnumerable<SpecializationDto>>;