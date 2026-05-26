using LegalConnect.Application.Notifications.Commands.MarkAllNotificationsAsRead;
using LegalConnect.Application.Notifications.Commands.MarkNotificationAsRead;
using LegalConnect.Application.Notifications.Queries.GetUnreadCount;
using LegalConnect.Application.Notifications.Queries.GetUserNotifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Получить список уведомлений пользователя.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] Guid userId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetUserNotificationsQuery(userId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Получить количество непрочитанных уведомлений.
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(
        [FromQuery] Guid userId,
        CancellationToken cancellationToken)
    {
        var count = await _mediator.Send(
            new GetUnreadNotificationCountQuery(userId), cancellationToken);
        return Ok(new { count });
    }

    /// <summary>
    /// Пометить уведомление как прочитанное.
    /// </summary>
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        [FromQuery] Guid userId,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new MarkNotificationAsReadCommand(id, userId), cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Пометить все уведомления пользователя как прочитанные.
    /// </summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(
        [FromQuery] Guid userId,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new MarkAllNotificationsAsReadCommand(userId), cancellationToken);
        return NoContent();
    }
}
