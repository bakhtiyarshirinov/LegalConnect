using LegalConnect.Application.Slots.Queries.GetLawyerSlots;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Queries.GetAvailableSlots;

public class GetAvailableSlotsQueryHandler
    : IRequestHandler<GetAvailableSlotsQuery, IEnumerable<SlotDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAvailableSlotsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<SlotDto>> Handle(
        GetAvailableSlotsQuery request,
        CancellationToken cancellationToken)
    {
        // Date arrives pre-parsed as UTC midnight from the controller
        var dateUtc = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
        var slots = await _unitOfWork.Slots.GetAvailableByLawyerIdAsync(request.LawyerId, dateUtc);

        return slots.Select(s => new SlotDto(
            s.Id,
            s.StartTime,
            s.EndTime,
            s.IsBooked,
            (int)(s.EndTime - s.StartTime).TotalMinutes
        ));
    }
}
