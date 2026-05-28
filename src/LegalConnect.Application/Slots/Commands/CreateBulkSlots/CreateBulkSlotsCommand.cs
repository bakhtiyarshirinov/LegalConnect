using MediatR;

namespace LegalConnect.Application.Slots.Commands.CreateBulkSlots;

public record CreateBulkSlotsCommand(
    Guid LawyerId,
    DateTime Date,
    int SlotDurationMinutes,
    int StartHour,
    int EndHour
) : IRequest<int>;
