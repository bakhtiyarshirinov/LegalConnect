using LegalConnect.Application.Chat.Common;
using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetChatMessages;

public class GetChatMessagesQueryHandler
    : IRequestHandler<GetChatMessagesQuery, IEnumerable<MessageDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetChatMessagesQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<IEnumerable<MessageDto>> Handle(
        GetChatMessagesQuery request,
        CancellationToken cancellationToken)
    {
        var chat = await _unitOfWork.Chats.GetByIdAsync(request.ChatId);
        if (chat is null)
            throw new KeyNotFoundException($"Chat with id {request.ChatId} not found");

        await ChatParticipantGuard.EnsureParticipantAsync(_unitOfWork, chat, _currentUser.UserId);

        var messages = await _unitOfWork.Chats.GetMessagesAsync(request.ChatId);

        return messages.Select(m => new MessageDto(
            Id: m.Id,
            SenderId: m.SenderId,
            SenderFullName: m.Sender.FullName,
            Content: m.Content,
            IsRead: m.IsRead,
            SentAt: m.SentAt,
            Type: m.Type.ToString()));
    }
}
