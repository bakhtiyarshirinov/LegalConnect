using LegalConnect.Application.Common.Exceptions;
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
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            throw new KeyNotFoundException($"User with email {request.Email} not found");

        // Берём последний ещё активный код и сверяем вручную,
        // чтобы считать неудачные попытки и сжигать код после лимита.
        var otp = await _unitOfWork.OtpCodes.GetLatestActiveByEmailAsync(request.Email);
        if (otp is null)
            throw new BadRequestException("Invalid or expired OTP code");

        if (otp.Code != request.Code)
        {
            otp.RegisterFailedAttempt();
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            throw new BadRequestException(otp.IsExhausted
                ? "Too many incorrect attempts. Request a new code."
                : "Invalid or expired OTP code");
        }

        otp.MarkAsUsed();
        user.Verify();
        _unitOfWork.Users.Update(user);

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
