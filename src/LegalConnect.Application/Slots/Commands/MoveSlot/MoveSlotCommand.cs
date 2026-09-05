using MediatR;

namespace LegalConnect.Application.Slots.Commands.MoveSlot;

/// <summary>
/// Moves a free availability slot to a new time range — used by the Cədvəl drag-and-drop
/// grid and by the quick-edit modal. A booked slot can never be moved (rejected with a
/// clear message, not a generic failure).
/// </summary>
public record MoveSlotCommand(Guid SlotId, DateTime StartTime, DateTime EndTime) : IRequest;
