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

    /// <summary>Уведомления текущего пользователя (идентичность из JWT).</summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetUserNotificationsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>Количество непрочитанных уведомлений текущего пользователя.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var count = await _mediator.Send(new GetUnreadNotificationCountQuery(), cancellationToken);
        return Ok(new { count });
    }

    /// <summary>Пометить уведомление как прочитанное (только своё).</summary>
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new MarkNotificationAsReadCommand(id), cancellationToken);
        return NoContent();
    }

    /// <summary>Пометить все свои уведомления как прочитанные.</summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        await _mediator.Send(new MarkAllNotificationsAsReadCommand(), cancellationToken);
        return NoContent();
    }
}
