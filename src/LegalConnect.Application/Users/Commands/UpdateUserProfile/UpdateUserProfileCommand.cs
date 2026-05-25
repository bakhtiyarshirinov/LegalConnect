using MediatR;

namespace LegalConnect.Application.Users.Commands.UpdateUserProfile;

public record UpdateUserProfileCommand(
    Guid UserId,
    string FullName,
    string? Phone,
    string? AvatarUrl
) : IRequest;
