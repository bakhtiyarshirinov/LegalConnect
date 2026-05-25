using LegalConnect.Application.Common.Models;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.RegisterClient;

public record RegisterClientCommand(
    string FullName,
    string Email,
    string Password,
    string? Phone
) : IRequest<AuthResult>;
