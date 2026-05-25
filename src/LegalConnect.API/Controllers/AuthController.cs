using LegalConnect.Application.Auth.Commands.Login;
using LegalConnect.Application.Auth.Commands.Register;
using LegalConnect.Application.Auth.Commands.RegisterClient;
using LegalConnect.Application.Auth.Commands.RegisterLawyer;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>POST /api/auth/register — legacy generic registration (role = Client).</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>POST /api/auth/register/client — register as a client.</summary>
    [HttpPost("register/client")]
    public async Task<IActionResult> RegisterClient(
        [FromBody] RegisterClientCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>POST /api/auth/register/lawyer — register as a lawyer (creates User + LawyerProfile).</summary>
    [HttpPost("register/lawyer")]
    public async Task<IActionResult> RegisterLawyer(
        [FromBody] RegisterLawyerCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>POST /api/auth/login — authenticate and receive JWT.</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
