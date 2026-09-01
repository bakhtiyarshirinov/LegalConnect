using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Domain.Interfaces;

namespace LegalConnect.Application.Chat.Common;

/// <summary>
/// Enforces that a caller (identified by their <b>User</b> id) is a participant of a chat.
/// A chat stores <c>ClientId</c> as a User id and <c>LawyerId</c> as a Lawyer-profile id.
/// </summary>
public static class ChatParticipantGuard
{
    public static async Task EnsureParticipantAsync(
        IUnitOfWork unitOfWork,
        Domain.Entities.Chat chat,
        Guid callerUserId)
    {
        if (chat.ClientId == callerUserId)
            return;

        var lawyerProfile = await unitOfWork.Lawyers.GetByUserIdAsync(callerUserId);
        if (lawyerProfile is not null && chat.LawyerId == lawyerProfile.Id)
            return;

        throw new ForbiddenAccessException("You are not a participant of this chat.");
    }
}
