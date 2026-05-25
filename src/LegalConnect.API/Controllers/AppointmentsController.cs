using LegalConnect.Application.Appointments.Commands.CancelAppointment;
using LegalConnect.Application.Appointments.Commands.ConfirmAppointment;
using LegalConnect.Application.Appointments.Commands.CreateAppointment;
using LegalConnect.Application.Appointments.Queries.GetClientAppointments;
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
        [FromQuery] Guid lawyerId,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new ConfirmAppointmentCommand(id, lawyerId), cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(
        Guid id,
        [FromQuery] Guid userId,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new CancelAppointmentCommand(id, userId), cancellationToken);
        return NoContent();
    }

    [HttpGet("client/{clientId:guid}")]
    public async Task<IActionResult> GetClientAppointments(
        Guid clientId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetClientAppointmentsQuery(clientId), cancellationToken);
        return Ok(result);
    }
}
