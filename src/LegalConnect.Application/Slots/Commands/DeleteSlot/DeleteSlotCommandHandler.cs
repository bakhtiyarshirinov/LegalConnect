using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Commands.DeleteSlot;

public class DeleteSlotCommandHandler : IRequestHandler<DeleteSlotCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteSlotCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task Handle(
        DeleteSlotCommand request,
        CancellationToken cancellationToken)
    {
        var profile = await _unitOfWork.Lawyers.GetByUserIdAsync(_currentUser.UserId)
            ?? throw new ForbiddenAccessException("Only a lawyer can manage availability slots.");

        var slot = await _unitOfWork.Slots.GetByIdAsync(request.SlotId);
        if (slot is null)
            throw new KeyNotFoundException($"Slot with id {request.SlotId} not found");

        if (slot.LawyerId != profile.Id)
            throw new ForbiddenAccessException("This slot belongs to another lawyer.");

        if (slot.IsBooked)
            throw new InvalidOperationException("Cannot delete a booked slot");

        _unitOfWork.Slots.Delete(slot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
