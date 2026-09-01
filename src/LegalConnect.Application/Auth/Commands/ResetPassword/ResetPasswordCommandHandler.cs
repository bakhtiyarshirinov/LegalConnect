using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.ResetPassword;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public ResetPasswordCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        var otp = await _unitOfWork.OtpCodes.GetLatestActiveByEmailAsync(request.Email);

        // Same response whether the e-mail is unknown or the code is wrong — no enumeration.
        if (user is null || otp is null)
            throw new BadRequestException("Invalid or expired code");

        if (otp.Code != request.Code)
        {
            otp.RegisterFailedAttempt();
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            throw new BadRequestException(otp.IsExhausted
                ? "Too many incorrect attempts. Request a new code."
                : "Invalid or expired code");
        }

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatePassword(newHash);
        _unitOfWork.Users.Update(user);

        otp.MarkAsUsed();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
