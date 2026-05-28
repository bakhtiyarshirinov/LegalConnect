using LegalConnect.Application.Slots.Queries.GetLawyerSlots;
using MediatR;

namespace LegalConnect.Application.Slots.Queries.GetAvailableSlots;

public record GetAvailableSlotsQuery(
    Guid LawyerId,
    DateTime Date
) : IRequest<IEnumerable<SlotDto>>;
