using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.MarkMessagesAsRead;

public class MarkMessagesAsReadCommandHandler : IRequestHandler<MarkMessagesAsReadCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public MarkMessagesAsReadCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(
        MarkMessagesAsReadCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем что чат существует
        var chat = await _unitOfWork.Chats.GetByIdAsync(request.ChatId);
        if (chat is null)
            throw new KeyNotFoundException($"Chat with id {request.ChatId} not found");

        // 2️⃣ Помечаем все непрочитанные сообщения от другой стороны
        // (только сообщения от собеседника — не от самого читателя)
        foreach (var message in chat.Messages.Where(m => !m.IsRead && m.SenderId != request.UserId))
            message.MarkAsRead();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
