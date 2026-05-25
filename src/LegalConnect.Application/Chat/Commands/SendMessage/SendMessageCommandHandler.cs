using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.SendMessage;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, MessageDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public SendMessageCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MessageDto> Handle(
        SendMessageCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем что чат существует
        var chat = await _unitOfWork.Chats.GetByIdAsync(request.ChatId);
        if (chat is null)
            throw new KeyNotFoundException($"Chat with id {request.ChatId} not found");

        // 2️⃣ Проверяем что отправитель существует
        var sender = await _unitOfWork.Users.GetByIdAsync(request.SenderId);
        if (sender is null)
            throw new KeyNotFoundException($"User with id {request.SenderId} not found");

        // 3️⃣ Проверяем что отправитель является участником чата
        // ClientId — это User.Id клиента
        // LawyerId — это Lawyer.Id (профиль юриста)
        var isClient = chat.ClientId == request.SenderId;
        var isLawyer = false;

        if (!isClient)
        {
            var lawyerProfile = await _unitOfWork.Lawyers
                .GetByUserIdAsync(request.SenderId);
            isLawyer = lawyerProfile is not null && chat.LawyerId == lawyerProfile.Id;
        }

        if (!isClient && !isLawyer)
            throw new InvalidOperationException(
                "You are not a participant of this chat");

        // 4️⃣ Создаём сообщение
        var message = Domain.Entities.Message.Create(
            chatId: request.ChatId,
            senderId: request.SenderId,
            content: request.Content);

        // 5️⃣ Сохраняем сообщение и обновляем LastMessageAt
        await _unitOfWork.Chats.AddMessageAsync(message);
        chat.UpdateLastMessage();
        _unitOfWork.Chats.Update(chat);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new MessageDto(
            Id: message.Id,
            SenderId: message.SenderId,
            SenderFullName: sender.FullName,
            Content: message.Content,
            IsRead: message.IsRead,
            SentAt: message.SentAt);
    }
}
