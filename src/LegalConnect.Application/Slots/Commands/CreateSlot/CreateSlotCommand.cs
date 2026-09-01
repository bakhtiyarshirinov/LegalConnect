using MediatR;

namespace LegalConnect.Application.Slots.Commands.CreateSlot;

/// <summary>Lawyer identity is resolved from the JWT in the handler, never from the body.</summary>
public record CreateSlotCommand(
    DateTime StartTime,
    DateTime EndTime
) : IRequest<Guid>;
