using LegalConnect.Application.Chat.Commands.CreateChat;
using LegalConnect.Application.Chat.Commands.MarkMessagesAsRead;
using LegalConnect.Application.Chat.Commands.SendMessage;
using LegalConnect.Application.Chat.Queries.GetChatMessages;
using LegalConnect.Application.Chat.Queries.GetUnreadCount;
using LegalConnect.Application.Chat.Queries.GetUserChats;
using LegalConnect.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChatsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Создать чат между текущим клиентом и юристом.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateChat(
        [FromBody] CreateChatCommand command,
        CancellationToken cancellationToken)
    {
        var chatId = await _mediator.Send(command, cancellationToken);
        return Ok(new { chatId });
    }

    /// <summary>Список чатов текущего пользователя (идентичность из JWT).</summary>
    [HttpGet]
    public async Task<IActionResult> GetUserChats(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetUserChatsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>История сообщений чата — только для участников.</summary>
    [HttpGet("{chatId:guid}/messages")]
    public async Task<IActionResult> GetChatMessages(
        Guid chatId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetChatMessagesQuery(chatId), cancellationToken);
        return Ok(result);
    }

    /// <summary>GET /api/chats/unread-count — непрочитанные сообщения текущего пользователя.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var count = await _mediator.Send(new GetUnreadCountQuery(), cancellationToken);
        return Ok(new { count });
    }

    /// <summary>PUT /api/chats/{chatId}/read — пометить входящие сообщения прочитанными.</summary>
    [HttpPut("{chatId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(
        Guid chatId,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new MarkMessagesAsReadCommand(chatId), cancellationToken);
        return NoContent();
    }

    /// <summary>Отправить сообщение (отправитель — текущий пользователь из JWT).</summary>
    [HttpPost("{chatId:guid}/messages")]
    public async Task<IActionResult> SendMessage(
        Guid chatId,
        [FromBody] SendMessageBody body,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new SendMessageCommand(chatId, body.Content, body.Type),
            cancellationToken);
        return Ok(result);
    }
}

/// <summary>Тело запроса для отправки сообщения через REST.</summary>
public record SendMessageBody(string Content, MessageType Type = MessageType.Text);
