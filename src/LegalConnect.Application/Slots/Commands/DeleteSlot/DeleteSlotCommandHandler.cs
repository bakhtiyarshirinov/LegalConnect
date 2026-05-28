using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Commands.DeleteSlot;

public class DeleteSlotCommandHandler : IRequestHandler<DeleteSlotCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteSlotCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(
        DeleteSlotCommand request,
        CancellationToken cancellationToken)
    {
        var slot = await _unitOfWork.Slots.GetByIdAsync(request.SlotId);
        if (slot is null)
            throw new KeyNotFoundException($"Slot with id {request.SlotId} not found");

        if (slot.LawyerId != request.LawyerId)
            throw new InvalidOperationException("You are not authorized to delete this slot");

        if (slot.IsBooked)
            throw new InvalidOperationException("Cannot delete a booked slot");

        _unitOfWork.Slots.Delete(slot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
