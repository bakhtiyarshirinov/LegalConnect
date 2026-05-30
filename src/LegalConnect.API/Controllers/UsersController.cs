using System.Security.Claims;
using LegalConnect.Application.Users.Commands.UpdateUserProfile;
using LegalConnect.Application.Users.Queries.GetCurrentUser;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>GET /api/users/me — returns current authenticated user's profile.</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _mediator.Send(new GetCurrentUserQuery(userId), cancellationToken);
        return Ok(result);
    }

    /// <summary>GET /api/users/{userId}/status — online status and last seen.</summary>
    [HttpGet("{userId:guid}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserStatus(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _mediator.Send(new LegalConnect.Application.Users.Queries.GetCurrentUser.GetCurrentUserQuery(userId), cancellationToken);
        return Ok(new
        {
            isOnline = user.LastSeen.HasValue && user.LastSeen.Value > DateTime.UtcNow.AddMinutes(-5),
            lastSeen = user.LastSeen
        });
    }

    /// <summary>PUT /api/users/me — updates current user's profile fields.</summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(
        [FromBody] UpdateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new UpdateUserProfileCommand(
            UserId: userId,
            FullName: request.FullName,
            Phone: request.Phone,
            AvatarUrl: request.AvatarUrl
        );
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID claim is missing");
        return Guid.Parse(claim);
    }
}

/// <summary>Request body for PUT /api/users/me (avoids exposing UserId in body).</summary>
public record UpdateUserProfileRequest(
    string FullName,
    string? Phone,
    string? AvatarUrl
);
