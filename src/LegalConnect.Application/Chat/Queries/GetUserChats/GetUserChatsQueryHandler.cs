using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetUserChats;

public class GetUserChatsQueryHandler
    : IRequestHandler<GetUserChatsQuery, IEnumerable<ChatDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUserChatsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ChatDto>> Handle(
        GetUserChatsQuery request,
        CancellationToken cancellationToken)
    {
        // Chat.ClientId — это User.Id клиента
        // Chat.LawyerId — это Lawyer.Id (профиль юриста, не User.Id)
        // Если пользователь — юрист, нужно сначала получить Lawyer.Id
        var lawyerProfile = await _unitOfWork.Lawyers.GetByUserIdAsync(request.UserId);
        var queryId = lawyerProfile is not null ? lawyerProfile.Id : request.UserId;

        var chats = await _unitOfWork.Chats.GetByUserIdAsync(queryId);

        return chats.Select(c => new ChatDto(
            Id: c.Id,
            LawyerFullName: c.Lawyer.User.FullName,
            ClientFullName: c.Client.FullName,
            LastMessageAt: c.LastMessageAt));
    }
}
