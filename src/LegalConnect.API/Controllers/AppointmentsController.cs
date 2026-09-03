using LegalConnect.Application.Appointments.Commands.CancelAppointment;
using LegalConnect.Application.Appointments.Commands.CompleteAppointment;
using LegalConnect.Application.Appointments.Commands.ConfirmAppointment;
using LegalConnect.Application.Appointments.Commands.CreateAppointment;
using LegalConnect.Application.Appointments.Commands.CreateMeeting;
using LegalConnect.Application.Appointments.Queries.GetClientAppointments;
using LegalConnect.Application.Appointments.Queries.GetLawyerAppointments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AppointmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        var appointmentId = await _mediator.Send(command, cancellationToken);
        return Ok(new { appointmentId });
    }

    [HttpPut("{id:guid}/confirm")]
    public async Task<IActionResult> Confirm(
        Guid id,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new ConfirmAppointmentCommand(id), cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// PUT /api/appointments/{id}/cancel — cancel an appointment (4.2).
    /// Reason is mandatory (min 10 chars). Client, the appointment's lawyer or an admin may call.
    /// </summary>
    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(
        Guid id,
        [FromBody] CancelAppointmentRequest body,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new CancelAppointmentCommand(id, body?.Reason, RequireReason: true),
            cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// DELETE /api/appointments/{id} — remove an appointment from the user's list (4.1).
    /// Same soft-cancel as PUT /cancel but the reason is optional. The row is kept for history.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromQuery] string? reason,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new CancelAppointmentCommand(id, reason, RequireReason: false),
            cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/complete")]
    public async Task<IActionResult> Complete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new CompleteAppointmentCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/create-meeting")]
    public async Task<IActionResult> CreateMeeting(
        Guid id,
        CancellationToken cancellationToken)
    {
        var meetingUrl = await _mediator.Send(new CreateMeetingCommand(id), cancellationToken);
        return Ok(new { meetingUrl });
    }

    /// <summary>
    /// GET /api/appointments/client — appointments of the authenticated client.
    /// The route no longer trusts a client id from the caller; identity comes from the JWT.
    /// </summary>
    [HttpGet("client/{clientId:guid?}")]
    public async Task<IActionResult> GetClientAppointments(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetClientAppointmentsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// GET /api/appointments/lawyer — appointments of the authenticated lawyer.
    /// Identity comes from the JWT; any id in the route is ignored.
    /// </summary>
    [HttpGet("lawyer/{lawyerId:guid?}")]
    public async Task<IActionResult> GetLawyerAppointments(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetLawyerAppointmentsQuery(), cancellationToken);
        return Ok(result);
    }
}

/// <summary>Request body for PUT /api/appointments/{id}/cancel.</summary>
public record CancelAppointmentRequest(string? Reason);
