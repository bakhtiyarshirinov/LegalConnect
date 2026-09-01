using LegalConnect.Application.Chat.Common;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.MarkMessagesAsRead;

public class MarkMessagesAsReadCommandHandler : IRequestHandler<MarkMessagesAsReadCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public MarkMessagesAsReadCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task Handle(
        MarkMessagesAsReadCommand request,
        CancellationToken cancellationToken)
    {
        var chat = await _unitOfWork.Chats.GetByIdAsync(request.ChatId);
        if (chat is null)
            throw new KeyNotFoundException($"Chat with id {request.ChatId} not found");

        var userId = _currentUser.UserId;
        await ChatParticipantGuard.EnsureParticipantAsync(_unitOfWork, chat, userId);

        // Помечаем прочитанными только входящие сообщения (не свои)
        foreach (var message in chat.Messages.Where(m => !m.IsRead && m.SenderId != userId))
            message.MarkAsRead();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
