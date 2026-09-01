using FluentValidation;

namespace LegalConnect.Application.Reviews.Commands.CreateReview;

public class CreateReviewCommandValidator
    : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewCommandValidator()
    {
        RuleFor(x => x.LawyerId)
            .NotEmpty().WithMessage("LawyerId is required");

        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("AppointmentId is required");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");

        RuleFor(x => x.Comment)
            .MaximumLength(500).WithMessage("Comment must not exceed 500 characters")
            .When(x => x.Comment is not null);
    }
}
