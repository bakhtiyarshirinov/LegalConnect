using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Commands.MoveSlot;

public class MoveSlotCommandHandler : IRequestHandler<MoveSlotCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public MoveSlotCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task Handle(MoveSlotCommand request, CancellationToken cancellationToken)
    {
        var profile = await _unitOfWork.Lawyers.GetByUserIdAsync(_currentUser.UserId)
            ?? throw new ForbiddenAccessException("Only a lawyer can manage availability slots.");

        var slot = await _unitOfWork.Slots.GetByIdAsync(request.SlotId);
        if (slot is null)
            throw new KeyNotFoundException($"Slot with id {request.SlotId} not found");

        if (slot.LawyerId != profile.Id)
            throw new ForbiddenAccessException("This slot belongs to another lawyer.");

        // Clear, specific message — dragging a booked slot must never look like a
        // silent no-op or a generic error.
        if (slot.IsBooked)
            throw new BadRequestException("Cannot move a booked slot — a client already has an appointment against it.");

        var startUtc = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(request.EndTime, DateTimeKind.Utc);

        // Overlap check EXCLUDING the slot being moved — this is exactly what the old
        // "create at new time, then delete the old one" workaround got wrong: it could
        // reject a valid move because the not-yet-deleted original slot's StartTime fell
        // inside the new range (e.g. dragging a slot earlier by less than its duration).
        var existing = await _unitOfWork.Slots.GetByLawyerIdAsync(profile.Id, startUtc, endUtc);
        if (existing.Any(s => s.Id != slot.Id))
            throw new InvalidOperationException("A slot already exists in this time range");

        slot.Reschedule(startUtc, endUtc);
        _unitOfWork.Slots.Update(slot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
