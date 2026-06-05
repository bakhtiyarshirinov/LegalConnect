using FluentValidation;

namespace LegalConnect.Application.Slots.Commands.CreateBulkSlots;

public class CreateBulkSlotsCommandValidator : AbstractValidator<CreateBulkSlotsCommand>
{
    public CreateBulkSlotsCommandValidator()
    {
        RuleFor(x => x.StartHour)
            .GreaterThanOrEqualTo(0).WithMessage("Start hour must be 0 or later")
            .LessThan(24).WithMessage("Start hour must be less than 24")
            .LessThan(x => x.EndHour).WithMessage("Start hour must be before end hour");

        RuleFor(x => x.EndHour)
            .GreaterThan(x => x.StartHour).WithMessage("End hour must be after start hour")
            .LessThanOrEqualTo(23).WithMessage("End hour must be 23 or earlier");

        RuleFor(x => x.SlotDurationMinutes)
            .Must(d => d == 30 || d == 60 || d == 90 || d == 120)
            .WithMessage("Duration must be 30, 60, 90 or 120 minutes");
    }
}
