using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Common.Models;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.RegisterClient;

public class RegisterClientCommandHandler : IRequestHandler<RegisterClientCommand, AuthResult>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;

    public RegisterClientCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
    }

    public async Task<AuthResult> Handle(
        RegisterClientCommand request,
        CancellationToken cancellationToken)
    {
        var emailExists = await _unitOfWork.Users.ExistsByEmailAsync(request.Email);
        if (emailExists)
            throw new InvalidOperationException("User with this email already exists");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = User.Create(
            email: request.Email,
            passwordHash: passwordHash,
            fullName: request.FullName,
            role: UserRole.Client,
            phone: request.Phone
        );

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateToken(user);

        return new AuthResult(
            UserId: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Role: user.Role.ToString(),
            Token: token,
            ExpiresAt: _jwtService.GetExpiration()
        );
    }
}
