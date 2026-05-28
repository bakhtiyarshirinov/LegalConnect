using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Notifications.Commands.CreateNotification;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.SendMessage;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, MessageDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly IMediator _mediator;

    public SendMessageCommandHandler(
        IUnitOfWork unitOfWork,
        IEmailService emailService,
        IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _mediator = mediator;
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
        var lawyerProfile = await _unitOfWork.Lawyers.GetByUserIdAsync(request.SenderId);
        var isLawyer = lawyerProfile is not null && chat.LawyerId == lawyerProfile.Id;

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

        // 6️⃣ Уведомляем получателя (in-app notification)
        await CreateInAppNotificationAsync(chat, isClient, sender, cancellationToken);

        // 7️⃣ Extract recipient data while DbContext is still alive, then fire-and-forget
        string? recipientEmail = null;
        string? recipientFullName = null;

        if (isClient)
        {
            var lawyerRecipient = await _unitOfWork.Lawyers.GetByIdAsync(chat.LawyerId);
            if (lawyerRecipient?.User is not null)
            {
                recipientEmail = lawyerRecipient.User.Email;
                recipientFullName = lawyerRecipient.User.FullName;
            }
        }
        else
        {
            var client = await _unitOfWork.Users.GetByIdAsync(chat.ClientId);
            if (client is not null)
            {
                recipientEmail = client.Email;
                recipientFullName = client.FullName;
            }
        }

        if (recipientEmail is not null && recipientFullName is not null)
        {
            var emailCopy = recipientEmail;
            var nameCopy = recipientFullName;
            var senderCopy = sender.FullName;
            var contentCopy = request.Content;
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendNewMessageNotificationAsync(
                        email: emailCopy,
                        fullName: nameCopy,
                        senderName: senderCopy,
                        messagePreview: contentCopy);
                }
                catch { }
            });
        }

        return new MessageDto(
            Id: message.Id,
            SenderId: message.SenderId,
            SenderFullName: sender.FullName,
            Content: message.Content,
            IsRead: message.IsRead,
            SentAt: message.SentAt);
    }

    private async Task CreateInAppNotificationAsync(
        Domain.Entities.Chat chat,
        bool senderIsClient,
        Domain.Entities.User sender,
        CancellationToken cancellationToken)
    {
        try
        {
            Guid recipientUserId;

            if (senderIsClient)
            {
                // Клиент → получатель юрист
                var lawyerProfile = await _unitOfWork.Lawyers.GetByIdAsync(chat.LawyerId);
                if (lawyerProfile is null) return;
                recipientUserId = lawyerProfile.UserId;
            }
            else
            {
                // Юрист → получатель клиент
                recipientUserId = chat.ClientId;
            }

            await _mediator.Send(new CreateNotificationCommand(
                UserId: recipientUserId,
                Title: "New Message",
                Body: $"You have a new message from {sender.FullName}",
                Type: "message"), cancellationToken);
        }
        catch
        {
            // In-app уведомление — некритичная операция
        }
    }

}
