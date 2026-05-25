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
        // 1️⃣ Проверяем что клиент существует
        var client = await _unitOfWork.Users.GetByIdAsync(request.ClientId);
        if (client is null)
            throw new KeyNotFoundException($"User with id {request.ClientId} not found");

        // 2️⃣ Проверяем что юрист существует
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);
        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        // 3️⃣ Проверяем что чат ещё не существует
        var exists = await _unitOfWork.Chats
            .ExistsByClientAndLawyerAsync(request.ClientId, request.LawyerId);
        if (exists)
            throw new InvalidOperationException(
                "Chat between this client and lawyer already exists");

        // 4️⃣ Создаём чат
        var chat = Domain.Entities.Chat.Create(request.ClientId, request.LawyerId);

        await _unitOfWork.Chats.AddAsync(chat);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return chat.Id;
    }
}
