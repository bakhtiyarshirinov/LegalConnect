using FluentValidation;

namespace LegalConnect.Application.Auth.Commands.VerifyOtp;

public class VerifyOtpCommandValidator : AbstractValidator<VerifyOtpCommand>
{
    public VerifyOtpCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("OTP code is required")
            .Length(6).WithMessage("OTP code must be 6 digits")
            .Matches("^[0-9]{6}$").WithMessage("OTP code must contain only digits");
    }
}
