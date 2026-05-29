using LegalConnect.Application.Chat.Commands.MarkMessagesAsRead;
using LegalConnect.Application.Chat.Commands.SendMessage;
using LegalConnect.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;

namespace LegalConnect.SignalR.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IServiceScopeFactory _scopeFactory;

    public ChatHub(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task JoinChat(Guid chatId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId.ToString());
    }

    public async Task LeaveChat(Guid chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId.ToString());
    }

    public async Task SendMessage(Guid chatId, string content, string messageType = "Text")
    {
        var userId = GetUserId();

        var type = Enum.TryParse<MessageType>(messageType, ignoreCase: true, out var parsed)
            ? parsed
            : MessageType.Text;

        using var scope = _scopeFactory.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        var messageDto = await mediator.Send(
            new SendMessageCommand(chatId, userId, content, type));

        await Clients.Group(chatId.ToString())
            .SendAsync("ReceiveMessage", messageDto);
    }

    public async Task MarkAsRead(Guid chatId)
    {
        var userId = GetUserId();

        using var scope = _scopeFactory.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        await mediator.Send(new MarkMessagesAsReadCommand(chatId, userId));

        await Clients.OthersInGroup(chatId.ToString())
            .SendAsync("MessagesRead", new { ChatId = chatId, ReadBy = userId });
    }

    private Guid GetUserId()
    {
        var raw = Context.UserIdentifier
            ?? throw new HubException("Unauthorized: user identifier not found");

        if (!Guid.TryParse(raw, out var userId))
            throw new HubException("Unauthorized: invalid user identifier");

        return userId;
    }
}
