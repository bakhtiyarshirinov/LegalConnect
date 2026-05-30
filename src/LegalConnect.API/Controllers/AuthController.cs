using LegalConnect.Application.Auth.Commands.ForgotPassword;
using LegalConnect.Application.Auth.Commands.Login;
using LegalConnect.Application.Auth.Commands.Register;
using LegalConnect.Application.Auth.Commands.RegisterClient;
using LegalConnect.Application.Auth.Commands.RegisterLawyer;
using LegalConnect.Application.Auth.Commands.ResendOtp;
using LegalConnect.Application.Auth.Commands.ResetPassword;
using LegalConnect.Application.Auth.Commands.VerifyOtp;
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

    /// <summary>POST /api/auth/verify-otp — verify email with OTP code, returns JWT.</summary>
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] VerifyOtpCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>POST /api/auth/resend-otp — resend OTP code to email.</summary>
    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp(
        [FromBody] ResendOtpCommand command,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(command, cancellationToken);
        return Ok(new { message = "OTP code has been sent to your email" });
    }

    /// <summary>POST /api/auth/forgot-password — send password reset code to email.</summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordCommand command,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(command, cancellationToken);
        return Ok(new { message = "If this email is registered, a reset code has been sent" });
    }

    /// <summary>POST /api/auth/reset-password — reset password using OTP code.</summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordCommand command,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(command, cancellationToken);
        return Ok(new { message = "Password reset successfully" });
    }
}
