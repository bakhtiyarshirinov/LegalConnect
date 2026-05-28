using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Queries.GetLawyerSlots;

public class GetLawyerSlotsQueryHandler
    : IRequestHandler<GetLawyerSlotsQuery, IEnumerable<SlotDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLawyerSlotsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<SlotDto>> Handle(
        GetLawyerSlotsQuery request,
        CancellationToken cancellationToken)
    {
        // From/To arrive pre-parsed as UTC from the controller
        var fromUtc = DateTime.SpecifyKind(request.From, DateTimeKind.Utc);
        var toUtc = DateTime.SpecifyKind(request.To, DateTimeKind.Utc);
        var slots = await _unitOfWork.Slots
            .GetByLawyerIdAsync(request.LawyerId, fromUtc, toUtc);

        return slots.Select(s => new SlotDto(
            s.Id,
            s.StartTime,
            s.EndTime,
            s.IsBooked,
            (int)(s.EndTime - s.StartTime).TotalMinutes
        ));
    }
}
