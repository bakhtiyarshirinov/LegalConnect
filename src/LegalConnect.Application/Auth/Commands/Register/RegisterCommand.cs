using LegalConnect.Application.Common.Models;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.Register;

public record RegisterCommand(
    string FullName,
    string Email,
    string Password,
    string? Phone
) : IRequest<AuthResult>;