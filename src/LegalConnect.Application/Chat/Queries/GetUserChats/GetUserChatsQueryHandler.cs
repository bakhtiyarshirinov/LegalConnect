using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetUserChats;

public class GetUserChatsQueryHandler
    : IRequestHandler<GetUserChatsQuery, IEnumerable<ChatDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetUserChatsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<IEnumerable<ChatDto>> Handle(
        GetUserChatsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;

        // Для юриста чаты хранятся под Lawyer.Id, для клиента — под User.Id
        var lawyerProfile = await _unitOfWork.Lawyers.GetByUserIdAsync(userId);
        var lookupId = lawyerProfile?.Id ?? userId;

        var chats = await _unitOfWork.Chats.GetByUserIdAsync(lookupId);

        return chats.Select(c => new ChatDto(
            Id: c.Id,
            LawyerFullName: c.Lawyer.User.FullName,
            ClientFullName: c.Client.FullName,
            LastMessageAt: c.LastMessageAt,
            LawyerUserId: c.Lawyer.UserId));
    }
}
