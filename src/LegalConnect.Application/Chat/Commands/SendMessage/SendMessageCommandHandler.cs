using LegalConnect.Application.Chat.Common;
using LegalConnect.Application.Chat.DTOs;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Notifications.Commands.CreateNotification;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Chat.Commands.SendMessage;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, MessageDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<SendMessageCommandHandler> _logger;

    public SendMessageCommandHandler(
        IUnitOfWork unitOfWork,
        IEmailService emailService,
        IMediator mediator,
        ICurrentUserService currentUser,
        ILogger<SendMessageCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _mediator = mediator;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<MessageDto> Handle(
        SendMessageCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Отправитель — текущий пользователь из JWT
        var senderId = _currentUser.UserId;

        var chat = await _unitOfWork.Chats.GetByIdAsync(request.ChatId);
        if (chat is null)
            throw new KeyNotFoundException($"Chat with id {request.ChatId} not found");

        var sender = await _unitOfWork.Users.GetByIdAsync(senderId);
        if (sender is null)
            throw new KeyNotFoundException($"User with id {senderId} not found");

        // 2️⃣ Отправитель обязан быть участником чата (проверка не обходится — id из токена)
        await ChatParticipantGuard.EnsureParticipantAsync(_unitOfWork, chat, senderId);

        var isClient = chat.ClientId == senderId;

        // 3️⃣ Создаём сообщение
        var message = Domain.Entities.Message.Create(
            chatId: request.ChatId,
            senderId: senderId,
            content: request.Content,
            type: request.Type);

        await _unitOfWork.Chats.AddMessageAsync(message);
        chat.UpdateLastMessage();
        _unitOfWork.Chats.Update(chat);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4️⃣ In-app уведомление получателю
        await CreateInAppNotificationAsync(chat, isClient, sender, cancellationToken);

        // 5️⃣ Данные получателя для письма (пока DbContext жив), затем fire-and-forget
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
            var chatIdCopy = chat.Id;
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
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Failed to send new-message e-mail notification for chat {ChatId}", chatIdCopy);
                }
            });
        }

        return new MessageDto(
            Id: message.Id,
            SenderId: message.SenderId,
            SenderFullName: sender.FullName,
            Content: message.Content,
            IsRead: message.IsRead,
            SentAt: message.SentAt,
            Type: message.Type.ToString());
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
                var lawyerProfile = await _unitOfWork.Lawyers.GetByIdAsync(chat.LawyerId);
                if (lawyerProfile is null) return;
                recipientUserId = lawyerProfile.UserId;
            }
            else
            {
                recipientUserId = chat.ClientId;
            }

            await _mediator.Send(new CreateNotificationCommand(
                UserId: recipientUserId,
                Title: "New Message",
                Body: $"You have a new message from {sender.FullName}",
                Type: "message"), cancellationToken);
        }
        catch (Exception ex)
        {
            // In-app уведомление — некритичная операция, но сбой фиксируем
            _logger.LogError(ex,
                "Failed to create in-app notification for chat {ChatId}", chat.Id);
        }
    }
}
