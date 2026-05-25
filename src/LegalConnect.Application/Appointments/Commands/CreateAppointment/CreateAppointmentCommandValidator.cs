using FluentValidation;

namespace LegalConnect.Application.Appointments.Commands.CreateAppointment;

public class CreateAppointmentCommandValidator
    : AbstractValidator<CreateAppointmentCommand>
{
    public CreateAppointmentCommandValidator()
    {
        RuleFor(x => x.ClientId)
            .NotEmpty().WithMessage("ClientId is required");

        RuleFor(x => x.LawyerId)
            .NotEmpty().WithMessage("LawyerId is required");

        RuleFor(x => x.ScheduledAt)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("Appointment must be scheduled in the future");

        RuleFor(x => x.DurationMinutes)
            .GreaterThanOrEqualTo(30).WithMessage("Duration must be at least 30 minutes")
            .LessThanOrEqualTo(480).WithMessage("Duration must not exceed 8 hours");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid appointment type");
    }
}