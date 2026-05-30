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
        var otp = await _unitOfWork.OtpCodes.GetActiveByEmailAndCodeAsync(request.Email, request.Code);
        if (otp is null)
            throw new InvalidOperationException("Invalid or expired code");

        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user is null)
            throw new KeyNotFoundException("User not found");

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatePassword(newHash);
        _unitOfWork.Users.Update(user);

        otp.MarkAsUsed();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
