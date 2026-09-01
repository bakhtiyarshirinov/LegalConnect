using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Auth.Commands.ForgotPassword;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailService _emailService;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    public ForgotPasswordCommandHandler(
        IUnitOfWork unitOfWork,
        IEmailService emailService,
        ILogger<ForgotPasswordCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null) return; // Silent — don't leak whether email exists

        var code = Random.Shared.Next(100000, 999999).ToString();
        var otpCode = OtpCode.Create(user.Email, code);
        await _unitOfWork.OtpCodes.AddAsync(otpCode);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userIdForLog = user.Id;
        _ = Task.Run(async () =>
        {
            try { await _emailService.SendPasswordResetAsync(user.Email, user.FullName, code); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password-reset e-mail for user {UserId}", userIdForLog);
            }
        });
    }
}
