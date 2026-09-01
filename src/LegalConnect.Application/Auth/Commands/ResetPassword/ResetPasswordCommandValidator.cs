using FluentValidation;

namespace LegalConnect.Application.Auth.Commands.ResetPassword;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("OTP code is required")
            .Length(6).WithMessage("OTP code must be 6 digits")
            .Matches("^[0-9]{6}$").WithMessage("OTP code must contain only digits");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches("[A-Z]").WithMessage("Password must contain uppercase letter")
            .Matches("[0-9]").WithMessage("Password must contain a number");
    }
}
