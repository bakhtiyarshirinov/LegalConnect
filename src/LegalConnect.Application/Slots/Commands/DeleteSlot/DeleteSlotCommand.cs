using MediatR;

namespace LegalConnect.Application.Slots.Commands.DeleteSlot;

public record DeleteSlotCommand(Guid SlotId) : IRequest;
