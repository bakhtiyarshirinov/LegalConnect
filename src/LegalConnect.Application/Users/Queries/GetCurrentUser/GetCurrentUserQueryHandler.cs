using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Users.Queries.GetCurrentUser;

public class GetCurrentUserQueryHandler
    : IRequestHandler<GetCurrentUserQuery, UserProfileDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetCurrentUserQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserProfileDto> Handle(
        GetCurrentUserQuery request,
        CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);

        if (user is null)
            throw new KeyNotFoundException($"User with id {request.UserId} not found");

        return new UserProfileDto(
            Id: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Phone: user.Phone,
            AvatarUrl: user.AvatarUrl,
            Role: user.Role.ToString(),
            IsVerified: user.IsVerified,
            CreatedAt: user.CreatedAt
        );
    }
}
