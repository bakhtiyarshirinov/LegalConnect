using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.CreateChat;

public class CreateChatCommandHandler : IRequestHandler<CreateChatCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateChatCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(
        CreateChatCommand request,
        CancellationToken cancellationToken)
    {
        var client = await _unitOfWork.Users.GetByIdAsync(request.ClientId);
        if (client is null)
            throw new KeyNotFoundException($"User with id {request.ClientId} not found");

        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);
        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        var hasConfirmed = await _unitOfWork.Appointments
            .HasConfirmedAsync(request.ClientId, request.LawyerId);
        if (!hasConfirmed)
            throw new InvalidOperationException(
                "Book and confirm an appointment first");

        var existing = await _unitOfWork.Chats
            .GetByUsersAsync(request.ClientId, request.LawyerId);
        if (existing is not null)
            return existing.Id;

        var chat = Domain.Entities.Chat.Create(request.ClientId, request.LawyerId);
        await _unitOfWork.Chats.AddAsync(chat);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return chat.Id;
    }
}
