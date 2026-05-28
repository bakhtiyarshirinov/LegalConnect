using FluentValidation;

namespace LegalConnect.Application.Slots.Commands.CreateSlot;

public class CreateSlotCommandValidator : AbstractValidator<CreateSlotCommand>
{
    public CreateSlotCommandValidator()
    {
        RuleFor(x => x.LawyerId).NotEmpty();

        RuleFor(x => x.StartTime)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("Start time must be in the future");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("End time must be after start time");

        RuleFor(x => x)
            .Must(x => (x.EndTime - x.StartTime).TotalHours <= 8)
            .WithMessage("Slot duration cannot exceed 8 hours");
    }
}
