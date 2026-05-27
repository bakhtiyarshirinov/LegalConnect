using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetAllUsers;

public record GetAllUsersQuery : IRequest<IEnumerable<UserAdminDto>>;
