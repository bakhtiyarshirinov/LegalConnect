using MediatR;

namespace LegalConnect.Application.Chat.Commands.CreateChat;

/// <summary>Client id is taken from the JWT in the handler, never from the request body.</summary>
public record CreateChatCommand(Guid LawyerId) : IRequest<Guid>;
