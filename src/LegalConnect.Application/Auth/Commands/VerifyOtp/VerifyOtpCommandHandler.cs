using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Common.Models;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.VerifyOtp;

public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, AuthResult>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;

    public VerifyOtpCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
    }

    public async Task<AuthResult> Handle(
        VerifyOtpCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Ищем пользователя по email
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            throw new KeyNotFoundException($"User with email {request.Email} not found");

        // 2️⃣ Ищем активный OTP-код
        var otpCode = await _unitOfWork.OtpCodes
            .GetActiveByEmailAndCodeAsync(request.Email, request.Code);

        if (otpCode is null)
            throw new InvalidOperationException("Invalid or expired OTP code");

        // 3️⃣ Помечаем код как использованный
        otpCode.MarkAsUsed();

        // 4️⃣ Верифицируем пользователя
        user.Verify();
        _unitOfWork.Users.Update(user);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5️⃣ Возвращаем токен
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
