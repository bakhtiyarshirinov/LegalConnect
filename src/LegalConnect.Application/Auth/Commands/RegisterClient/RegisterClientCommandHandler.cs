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
    private readonly IEmailService _emailService;

    public RegisterClientCommandHandler(
        IUnitOfWork unitOfWork,
        IJwtService jwtService,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _emailService = emailService;
    }

    public async Task<AuthResult> Handle(
        RegisterClientCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем уникальность email
        var emailExists = await _unitOfWork.Users.ExistsByEmailAsync(request.Email);
        if (emailExists)
            throw new InvalidOperationException("User with this email already exists");

        // 2️⃣ Хешируем пароль и создаём пользователя (IsVerified = false)
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = User.Create(
            email: request.Email,
            passwordHash: passwordHash,
            fullName: request.FullName,
            role: UserRole.Client,
            phone: request.Phone
        );

        await _unitOfWork.Users.AddAsync(user);

        // 3️⃣ Генерируем OTP-код
        var code = Random.Shared.Next(100000, 999999).ToString();
        var otpCode = OtpCode.Create(user.Email, code);
        await _unitOfWork.OtpCodes.AddAsync(otpCode);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4️⃣ Отправляем email с кодом
        await _emailService.SendOtpAsync(user.Email, user.FullName, code);

        // 5️⃣ Возвращаем результат (токен без IsVerified — пользователь должен подтвердить email)
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
