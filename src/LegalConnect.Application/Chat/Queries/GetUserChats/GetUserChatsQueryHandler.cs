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
        // Репозиторий сам обрабатывает оба случая:
        // c.ClientId == userId (клиент)
        // c.LawyerId == userId (юрист — через Lawyer.Id)
        // Но для юриста нужен Lawyer.Id, не User.Id
        var lawyerProfile = await _unitOfWork.Lawyers.GetByUserIdAsync(request.UserId);

        IEnumerable<Domain.Entities.Chat> chats;

        if (lawyerProfile is not null)
        {
            // Юрист — ищем по Lawyer.Id
            chats = await _unitOfWork.Chats.GetByUserIdAsync(lawyerProfile.Id);
        }
        else
        {
            // Клиент — ищем по User.Id
            chats = await _unitOfWork.Chats.GetByUserIdAsync(request.UserId);
        }

        return chats.Select(c => new ChatDto(
            Id: c.Id,
            LawyerFullName: c.Lawyer.User.FullName,
            ClientFullName: c.Client.FullName,
            LastMessageAt: c.LastMessageAt,
            LawyerUserId: c.Lawyer.UserId));
    }
}