using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Commands.CreateChat;

public class CreateChatCommandHandler : IRequestHandler<CreateChatCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateChatCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(
        CreateChatCommand request,
        CancellationToken cancellationToken)
    {
        // Чат создаёт клиент — им является текущий пользователь из JWT
        var clientId = _currentUser.UserId;
        if (_currentUser.IsInRole("Lawyer") || _currentUser.IsInRole("Admin"))
            throw new ForbiddenAccessException("Only clients can start a chat.");

        var client = await _unitOfWork.Users.GetByIdAsync(clientId);
        if (client is null)
            throw new KeyNotFoundException($"User with id {clientId} not found");

        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);
        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        var hasConfirmed = await _unitOfWork.Appointments
            .HasConfirmedAsync(clientId, request.LawyerId);
        if (!hasConfirmed)
            throw new BadRequestException(
                "Book and confirm an appointment first");

        var existing = await _unitOfWork.Chats
            .GetByUsersAsync(clientId, request.LawyerId);
        if (existing is not null)
            return existing.Id;

        var chat = Domain.Entities.Chat.Create(clientId, request.LawyerId);
        await _unitOfWork.Chats.AddAsync(chat);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return chat.Id;
    }
}
