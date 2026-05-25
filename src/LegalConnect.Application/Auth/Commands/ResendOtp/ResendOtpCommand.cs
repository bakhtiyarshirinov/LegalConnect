using MediatR;

namespace LegalConnect.Application.Auth.Commands.ResendOtp;

public record ResendOtpCommand(string Email) : IRequest;
