using LegalConnect.Application.Lawyers.Queries.GetLawyerById;
using MediatR;

namespace LegalConnect.Application.Lawyers.Queries.GetMyLawyerProfile;

public record GetMyLawyerProfileQuery(Guid UserId) : IRequest<LawyerDetailDto>;
