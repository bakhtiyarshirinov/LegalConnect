using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Users.Commands.UpdateUserProfile;

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUserProfileCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(
        UpdateUserProfileCommand request,
        CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);

        if (user is null)
            throw new KeyNotFoundException($"User with id {request.UserId} not found");

        user.UpdateProfile(request.FullName, request.Phone, request.AvatarUrl);
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
