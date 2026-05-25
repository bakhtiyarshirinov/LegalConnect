using LegalConnect.Application.Common.Models;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.Login;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthResult>;