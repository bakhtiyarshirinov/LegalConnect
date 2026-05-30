using LegalConnect.Application.Chat.Commands.MarkMessagesAsRead;
using LegalConnect.Application.Chat.Commands.SendMessage;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
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

    public override async Task OnConnectedAsync()
    {
        try
        {
            if (Guid.TryParse(Context.UserIdentifier, out var userId))
            {
                using var scope = _scopeFactory.CreateScope();
                var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var user = await uow.Users.GetByIdAsync(userId);
                if (user is not null)
                {
                    user.UpdateLastSeen();
                    uow.Users.Update(user);
                    await uow.SaveChangesAsync();
                }
            }
        }
        catch { /* non-critical */ }

        await base.OnConnectedAsync();
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
