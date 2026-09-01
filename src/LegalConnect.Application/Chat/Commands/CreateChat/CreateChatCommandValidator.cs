using FluentValidation;

namespace LegalConnect.Application.Chat.Commands.CreateChat;

public class CreateChatCommandValidator : AbstractValidator<CreateChatCommand>
{
    public CreateChatCommandValidator()
    {
        RuleFor(x => x.LawyerId)
            .NotEmpty().WithMessage("LawyerId is required");
    }
}
