using MediatR;

namespace LegalConnect.Application.Slots.Commands.CreateBulkSlots;

/// <summary>Lawyer identity is resolved from the JWT in the handler, never from the body.</summary>
public record CreateBulkSlotsCommand(
    DateTime Date,
    int SlotDurationMinutes,
    int StartHour,
    int EndHour
) : IRequest<int>;
