using FluentValidation;

namespace LegalConnect.Application.Lawyers.Commands.CancelLawyerVerification;

public class CancelLawyerVerificationCommandValidator
    : AbstractValidator<CancelLawyerVerificationCommand>
{
    public CancelLawyerVerificationCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MinimumLength(10).WithMessage("Reason must be at least 10 characters")
            .MaximumLength(1000).WithMessage("Reason must not exceed 1000 characters");
    }
}
