using LegalConnect.Application.Common.Models;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.VerifyOtp;

public record VerifyOtpCommand(
    string Email,
    string Code
) : IRequest<AuthResult>;
