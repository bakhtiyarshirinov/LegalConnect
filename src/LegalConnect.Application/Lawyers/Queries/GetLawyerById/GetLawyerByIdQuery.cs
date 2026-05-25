using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetLawyerById;

public record GetLawyerByIdQuery(Guid LawyerId) : IRequest<LawyerDetailDto>;