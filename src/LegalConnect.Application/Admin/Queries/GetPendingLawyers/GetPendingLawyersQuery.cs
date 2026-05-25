using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetPendingLawyers;

public record GetPendingLawyersQuery : IRequest<IEnumerable<PendingLawyerDto>>;
