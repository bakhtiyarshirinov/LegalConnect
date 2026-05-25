using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Common.Models;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResult>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;

    public RegisterCommandHandler(
        IUnitOfWork unitOfWork,
        IJwtService jwtService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
    }

    public async Task<AuthResult> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем что email не занят
        var emailExists = await _unitOfWork.Users.ExistsByEmailAsync(request.Email);

        if (emailExists)
            throw new InvalidOperationException("User with this email already exists");

        // 2️⃣ Хешируем пароль
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // 3️⃣ Создаём юзера через фабричный метод
        var user = User.Create(
            email: request.Email,
            passwordHash: passwordHash,
            fullName: request.FullName,
            role: UserRole.Client,
            phone: request.Phone
        );

        // 4️⃣ Сохраняем
        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5️⃣ Возвращаем результат
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