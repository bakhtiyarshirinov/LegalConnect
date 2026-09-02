using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetVerifiedLawyers;

public record GetVerifiedLawyersQuery : IRequest<IEnumerable<VerifiedLawyerDto>>;
