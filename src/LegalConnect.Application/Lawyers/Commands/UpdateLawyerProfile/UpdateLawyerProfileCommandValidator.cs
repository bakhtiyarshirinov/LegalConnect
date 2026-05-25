using FluentValidation;

namespace LegalConnect.Application.Lawyers.Commands.UpdateLawyerProfile;

public class UpdateLawyerProfileCommandValidator
    : AbstractValidator<UpdateLawyerProfileCommand>
{
    public UpdateLawyerProfileCommandValidator()
    {
        RuleFor(x => x.Bio)
            .NotEmpty().WithMessage("Bio is required")
            .MaximumLength(1000).WithMessage("Bio must not exceed 1000 characters");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters");

        RuleFor(x => x.HourlyRate)
            .GreaterThan(0).WithMessage("Hourly rate must be greater than 0");

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("Experience years must be 0 or more")
            .LessThan(60).WithMessage("Experience years must be less than 60");
    }
}
