using LegalConnect.Application.Chat.Commands.CreateChat;
using LegalConnect.Application.Chat.Commands.SendMessage;
using LegalConnect.Application.Chat.Queries.GetChatMessages;
using LegalConnect.Application.Chat.Queries.GetUserChats;
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

    /// <summary>
    /// Создать чат между клиентом и юристом.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateChat(
        [FromBody] CreateChatCommand command,
        CancellationToken cancellationToken)
    {
        var chatId = await _mediator.Send(command, cancellationToken);
        return Ok(new { chatId });
    }

    /// <summary>
    /// Получить список чатов текущего пользователя.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUserChats(
        [FromQuery] Guid userId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetUserChatsQuery(userId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Получить историю сообщений чата.
    /// </summary>
    [HttpGet("{chatId:guid}/messages")]
    public async Task<IActionResult> GetChatMessages(
        Guid chatId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetChatMessagesQuery(chatId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Отправить сообщение через REST (альтернатива SignalR).
    /// </summary>
    [HttpPost("{chatId:guid}/messages")]
    public async Task<IActionResult> SendMessage(
        Guid chatId,
        [FromBody] SendMessageBody body,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new SendMessageCommand(chatId, body.SenderId, body.Content),
            cancellationToken);
        return Ok(result);
    }
}

/// <summary>
/// Тело запроса для отправки сообщения через REST.
/// </summary>
public record SendMessageBody(Guid SenderId, string Content);
