using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetAllUsers;

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, IEnumerable<UserAdminDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllUsersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<UserAdminDto>> Handle(
        GetAllUsersQuery request,
        CancellationToken cancellationToken)
    {
        var users = await _unitOfWork.Users.GetAllAsync();

        return users.Select(u => new UserAdminDto(
            u.Id,
            u.FullName,
            u.Email,
            u.Role.ToString(),
            u.IsVerified,
            u.CreatedAt
        ));
    }
}
