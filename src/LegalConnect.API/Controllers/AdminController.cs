using LegalConnect.Application.Admin.Commands.VerifyLawyer;
using LegalConnect.Application.Admin.Queries.GetAllUsers;
using LegalConnect.Application.Admin.Queries.GetPendingLawyers;
using LegalConnect.Application.Admin.Queries.GetVerifiedLawyers;
using LegalConnect.Application.Lawyers.Commands.CancelLawyerVerification;
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

    /// <summary>GET /api/admin/lawyers/verified — returns all currently verified lawyer profiles.</summary>
    [HttpGet("lawyers/verified")]
    public async Task<IActionResult> GetVerifiedLawyers(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetVerifiedLawyersQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// PUT /api/admin/lawyers/{id}/cancel-verification — revokes a lawyer's verification.
    /// Body: { "reason": "string" } (required). Responds 204, mirroring /verify.
    /// </summary>
    [HttpPut("lawyers/{id:guid}/cancel-verification")]
    public async Task<IActionResult> CancelLawyerVerification(
        Guid id,
        [FromBody] CancelLawyerVerificationRequest body,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(new CancelLawyerVerificationCommand(id, body.Reason), cancellationToken);
        return NoContent();
    }

    /// <summary>GET /api/admin/users — returns all users.</summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetAllUsersQuery(), cancellationToken);
        return Ok(result);
    }
}

/// <summary>Request body for PUT /api/admin/lawyers/{id}/cancel-verification.</summary>
public record CancelLawyerVerificationRequest(string Reason);
