using System.Globalization;
using LegalConnect.Application.Slots.Commands.CreateBulkSlots;
using LegalConnect.Application.Slots.Commands.CreateSlot;
using LegalConnect.Application.Slots.Commands.DeleteSlot;
using LegalConnect.Application.Slots.Queries.GetAvailableSlots;
using LegalConnect.Application.Slots.Queries.GetLawyerSlots;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/slots")]
public class AvailabilitySlotsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AvailabilitySlotsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetSlots(
        [FromQuery] Guid lawyerId,
        [FromQuery] string from,
        [FromQuery] string to,
        CancellationToken cancellationToken)
    {
        var fromUtc = ParseDateUtc(from);
        var toUtc = ParseDateUtc(to);
        if (fromUtc is null || toUtc is null)
            return BadRequest("Invalid date format. Use yyyy-MM-dd or ISO 8601.");

        var result = await _mediator.Send(
            new GetLawyerSlotsQuery(lawyerId, fromUtc.Value, toUtc.Value), cancellationToken);
        return Ok(result);
    }

    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] Guid lawyerId,
        [FromQuery] string date,
        CancellationToken cancellationToken)
    {
        var dateUtc = ParseDateUtc(date);
        if (dateUtc is null)
            return BadRequest("Invalid date format. Use yyyy-MM-dd or ISO 8601.");

        var result = await _mediator.Send(
            new GetAvailableSlotsQuery(lawyerId, dateUtc.Value), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateSlot(
        [FromBody] CreateSlotCommand command,
        CancellationToken cancellationToken)
    {
        var slotId = await _mediator.Send(command, cancellationToken);
        return Ok(new { slotId });
    }

    [HttpPost("bulk")]
    [Authorize]
    public async Task<IActionResult> CreateBulkSlots(
        [FromBody] CreateBulkSlotsCommand command,
        CancellationToken cancellationToken)
    {
        var count = await _mediator.Send(command, cancellationToken);
        return Ok(new { count });
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteSlot(
        Guid id,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteSlotCommand(id), cancellationToken);
        return NoContent();
    }

    private static DateTime? ParseDateUtc(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        // Try ISO 8601 with time (2026-05-29T00:00:00Z or 2026-05-29T00:00:00.000Z)
        if (DateTime.TryParse(value, CultureInfo.InvariantCulture,
            DateTimeStyles.RoundtripKind, out var parsed))
        {
            return DateTime.SpecifyKind(parsed.Date, DateTimeKind.Utc);
        }

        // Try date-only (2026-05-29)
        if (DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var dateOnly))
        {
            return DateTime.SpecifyKind(dateOnly.Date, DateTimeKind.Utc);
        }

        return null;
    }
}
