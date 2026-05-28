using MediatR;

namespace LegalConnect.Application.Slots.Commands.CreateSlot;

public record CreateSlotCommand(
    Guid LawyerId,
    DateTime StartTime,
    DateTime EndTime
) : IRequest<Guid>;
