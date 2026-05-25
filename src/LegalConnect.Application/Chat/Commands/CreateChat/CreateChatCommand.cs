using MediatR;

namespace LegalConnect.Application.Chat.Commands.CreateChat;

public record CreateChatCommand(
    Guid ClientId,
    Guid LawyerId
) : IRequest<Guid>;
