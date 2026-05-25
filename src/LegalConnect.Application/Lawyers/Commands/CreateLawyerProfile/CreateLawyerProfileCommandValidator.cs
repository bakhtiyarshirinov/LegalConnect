using FluentValidation;

namespace LegalConnect.Application.Lawyers.Commands.CreateLawyerProfile;

public class CreateLawyerProfileCommandValidator
    : AbstractValidator<CreateLawyerProfileCommand>
{
    public CreateLawyerProfileCommandValidator()
    {
        RuleFor(x => x.Bio)
            .NotEmpty().WithMessage("Bio is required")
            .MaximumLength(1000).WithMessage("Bio must not exceed 1000 characters");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters");

        RuleFor(x => x.LicenseNumber)
            .NotEmpty().WithMessage("License number is required")
            .MaximumLength(50).WithMessage("License number must not exceed 50 characters");

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("Experience years must be 0 or more")
            .LessThan(60).WithMessage("Experience years must be less than 60");

        RuleFor(x => x.HourlyRate)
            .GreaterThan(0).WithMessage("Hourly rate must be greater than 0");

        RuleFor(x => x.SpecializationIds)
            .NotEmpty().WithMessage("At least one specialization is required");
    }
}