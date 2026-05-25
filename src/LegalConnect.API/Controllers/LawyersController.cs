using System.Security.Claims;
using LegalConnect.Application.Lawyers.Commands.CreateLawyerProfile;
using LegalConnect.Application.Lawyers.Commands.UpdateLawyerProfile;
using LegalConnect.Application.Lawyers.Queries.GetLawyerById;
using LegalConnect.Application.Lawyers.Queries.GetLawyers;
using LegalConnect.Application.Lawyers.Queries.GetMyLawyerProfile;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LawyersController : ControllerBase
{
    private readonly IMediator _mediator;

    public LawyersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>GET /api/lawyers — public list with optional filters.</summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetLawyers(
        [FromQuery] string? city,
        [FromQuery] int? specializationId,
        [FromQuery] decimal? maxRate,
        CancellationToken cancellationToken)
    {
        var query = new GetLawyersQuery(city, specializationId, maxRate);
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>GET /api/lawyers/{id} — public lawyer detail by LawyerId.</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetLawyerById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var query = new GetLawyerByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>GET /api/lawyers/me — authenticated lawyer sees their own profile.</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _mediator.Send(new GetMyLawyerProfileQuery(userId), cancellationToken);
        return Ok(result);
    }

    /// <summary>PUT /api/lawyers/me — authenticated lawyer updates their profile.</summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateLawyerProfileRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new UpdateLawyerProfileCommand(
            UserId: userId,
            Bio: request.Bio,
            City: request.City,
            HourlyRate: request.HourlyRate,
            ExperienceYears: request.ExperienceYears,
            IsAvailable: request.IsAvailable
        );
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    /// <summary>POST /api/lawyers — create a lawyer profile for a given user (admin / internal use).</summary>
    [HttpPost]
    public async Task<IActionResult> CreateLawyerProfile(
        [FromBody] CreateLawyerProfileCommand command,
        CancellationToken cancellationToken)
    {
        var lawyerId = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(
            nameof(GetLawyerById),
            new { id = lawyerId },
            new { lawyerId });
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID claim is missing");
        return Guid.Parse(claim);
    }
}

/// <summary>Request body for PUT /api/lawyers/me.</summary>
public record UpdateLawyerProfileRequest(
    string Bio,
    string City,
    decimal HourlyRate,
    int ExperienceYears,
    bool IsAvailable
);
