using MediatR;

namespace LegalConnect.Application.Slots.Queries.GetLawyerSlots;

public record GetLawyerSlotsQuery(
    Guid LawyerId,
    DateTime From,
    DateTime To
) : IRequest<IEnumerable<SlotDto>>;
