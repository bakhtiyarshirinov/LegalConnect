using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.ResendOtp;

public class ResendOtpCommandHandler : IRequestHandler<ResendOtpCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;

    public ResendOtpCommandHandler(IUnitOfWork unitOfWork, IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
    }

    public async Task Handle(ResendOtpCommand request, CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем что пользователь существует
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            throw new KeyNotFoundException($"User with email {request.Email} not found");

        // 2️⃣ Проверяем что email ещё не подтверждён
        if (user.IsVerified)
            throw new InvalidOperationException("Email is already verified");

        // 3️⃣ Генерируем новый OTP-код
        var code = Random.Shared.Next(100000, 999999).ToString();
        var otpCode = OtpCode.Create(user.Email, code);
        await _unitOfWork.OtpCodes.AddAsync(otpCode);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4️⃣ Отправляем новый email
        await _emailService.SendOtpAsync(user.Email, user.FullName, code);
    }
}
