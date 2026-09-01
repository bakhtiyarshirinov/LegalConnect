using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Auth.Commands.ResendOtp;

public class ResendOtpCommandHandler : IRequestHandler<ResendOtpCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly ILogger<ResendOtpCommandHandler> _logger;

    public ResendOtpCommandHandler(
        IUnitOfWork unitOfWork,
        IEmailService emailService,
        ILogger<ResendOtpCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Handle(ResendOtpCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            throw new KeyNotFoundException($"User with email {request.Email} not found");

        if (user.IsVerified)
            throw new InvalidOperationException("Email is already verified");

        // Инвалидируем все предыдущие активные коды — работает только один, самый свежий
        await _unitOfWork.OtpCodes.InvalidateActiveCodesAsync(user.Email);

        var code = Random.Shared.Next(100000, 1000000).ToString("D6");
        var otpCode = OtpCode.Create(user.Email, code);
        await _unitOfWork.OtpCodes.AddAsync(otpCode);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Сбой SMTP не должен приводить к 500 — код уже сохранён, пользователь может
        // запросить повторно.
        try
        {
            await _emailService.SendOtpAsync(user.Email, user.FullName, code);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend OTP e-mail for user {UserId}", user.Id);
        }
    }
}
