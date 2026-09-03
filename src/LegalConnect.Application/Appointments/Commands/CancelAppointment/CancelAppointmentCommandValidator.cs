using FluentValidation;

namespace LegalConnect.Application.Appointments.Commands.CancelAppointment;

public class CancelAppointmentCommandValidator
    : AbstractValidator<CancelAppointmentCommand>
{
    public CancelAppointmentCommandValidator()
    {
        // "Cancel" (4.2): reason mandatory, same shape as CancelLawyerVerificationCommand.
        When(x => x.RequireReason, () =>
        {
            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("Reason is required")
                .MinimumLength(10).WithMessage("Reason must be at least 10 characters")
                .MaximumLength(1000).WithMessage("Reason must not exceed 1000 characters");
        });

        // "Delete" (4.1): reason optional, but still bounded when supplied.
        When(x => !x.RequireReason, () =>
        {
            RuleFor(x => x.Reason)
                .MaximumLength(1000).WithMessage("Reason must not exceed 1000 characters")
                .When(x => !string.IsNullOrWhiteSpace(x.Reason));
        });
    }
}
