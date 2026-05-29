using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetChatMessages;

public class GetChatMessagesQueryHandler
    : IRequestHandler<GetChatMessagesQuery, IEnumerable<MessageDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetChatMessagesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<MessageDto>> Handle(
        GetChatMessagesQuery request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем что чат существует
        var chat = await _unitOfWork.Chats.GetByIdAsync(request.ChatId);
        if (chat is null)
            throw new KeyNotFoundException($"Chat with id {request.ChatId} not found");

        // 2️⃣ Получаем сообщения с информацией об отправителях
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
