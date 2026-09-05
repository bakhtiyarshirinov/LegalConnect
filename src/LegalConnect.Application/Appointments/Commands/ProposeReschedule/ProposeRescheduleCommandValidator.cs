using FluentValidation;

namespace LegalConnect.Application.Appointments.Commands.ProposeReschedule;

public class ProposeRescheduleCommandValidator : AbstractValidator<ProposeRescheduleCommand>
{
    public ProposeRescheduleCommandValidator()
    {
        RuleFor(x => x.NewScheduledAt)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("The proposed time must be in the future");

        RuleFor(x => x.Reason)
            .MaximumLength(1000).WithMessage("Reason must not exceed 1000 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}
