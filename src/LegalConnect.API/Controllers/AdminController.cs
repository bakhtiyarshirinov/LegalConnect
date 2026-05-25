using LegalConnect.Application.Admin.Commands.VerifyLawyer;
using LegalConnect.Application.Admin.Queries.GetPendingLawyers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>GET /api/admin/lawyers/pending — returns all unverified lawyer profiles.</summary>
    [HttpGet("lawyers/pending")]
    public async Task<IActionResult> GetPendingLawyers(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetPendingLawyersQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>PUT /api/admin/lawyers/{id}/verify — marks a lawyer as verified.</summary>
    [HttpPut("lawyers/{id:guid}/verify")]
    public async Task<IActionResult> VerifyLawyer(Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new VerifyLawyerCommand(id), cancellationToken);
        return NoContent();
    }
}
