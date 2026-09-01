using FluentValidation;

namespace LegalConnect.Application.Chat.Commands.SendMessage;

public class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.ChatId)
            .NotEmpty().WithMessage("ChatId is required");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Message content cannot be empty")
            .MaximumLength(4000).WithMessage("Message must not exceed 4000 characters");
    }
}
