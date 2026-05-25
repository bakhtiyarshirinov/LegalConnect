using MediatR;

namespace LegalConnect.Application.Users.Queries.GetCurrentUser;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserProfileDto>;
