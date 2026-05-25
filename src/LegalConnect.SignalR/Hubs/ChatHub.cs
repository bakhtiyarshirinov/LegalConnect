using LegalConnect.Application.Chat.Commands.MarkMessagesAsRead;
using LegalConnect.Application.Chat.Commands.SendMessage;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace LegalConnect.SignalR.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IMediator _mediator;

    public ChatHub(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Подключиться к группе чата.
    /// Вызывается клиентом после установки соединения.
    /// </summary>
    public async Task JoinChat(Guid chatId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId.ToString());
    }

    /// <summary>
    /// Покинуть группу чата.
    /// </summary>
    public async Task LeaveChat(Guid chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId.ToString());
    }

    /// <summary>
    /// Отправить сообщение: сохраняет в БД и рассылает всем участникам чата.
    /// </summary>
    public async Task SendMessage(Guid chatId, string content)
    {
        var userId = GetUserId();

        var messageDto = await _mediator.Send(
            new SendMessageCommand(chatId, userId, content));

        // Рассылаем всем участникам группы (включая отправителя)
        await Clients.Group(chatId.ToString())
            .SendAsync("ReceiveMessage", messageDto);
    }

    /// <summary>
    /// Пометить все непрочитанные сообщения в чате как прочитанные.
    /// Уведомляет остальных участников группы.
    /// </summary>
    public async Task MarkAsRead(Guid chatId)
    {
        var userId = GetUserId();

        await _mediator.Send(new MarkMessagesAsReadCommand(chatId, userId));

        // Уведомляем других участников группы, что сообщения прочитаны
        await Clients.OthersInGroup(chatId.ToString())
            .SendAsync("MessagesRead", new { ChatId = chatId, ReadBy = userId });
    }

    // ────────────────────────────────────────────────────────────────────────

    private Guid GetUserId()
    {
        var raw = Context.UserIdentifier
            ?? throw new HubException("Unauthorized: user identifier not found");

        if (!Guid.TryParse(raw, out var userId))
            throw new HubException("Unauthorized: invalid user identifier");

        return userId;
    }
}
