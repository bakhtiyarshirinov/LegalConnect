using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Commands.CreateBulkSlots;

public class CreateBulkSlotsCommandHandler : IRequestHandler<CreateBulkSlotsCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateBulkSlotsCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(
        CreateBulkSlotsCommand request,
        CancellationToken cancellationToken)
    {
        var dateUtc = DateTime.SpecifyKind(request.Date.Date, DateTimeKind.Utc);
        var dayStart = dateUtc.AddHours(request.StartHour);
        var dayEnd = dateUtc.AddHours(request.EndHour);

        var existing = await _unitOfWork.Slots
            .GetByLawyerIdAsync(request.LawyerId, dayStart, dayEnd);
        var existingSet = existing.Select(s => s.StartTime).ToHashSet();

        var slots = new List<AvailabilitySlot>();
        var current = dayStart;

        while (current.AddMinutes(request.SlotDurationMinutes) <= dayEnd)
        {
            var end = current.AddMinutes(request.SlotDurationMinutes);
            if (!existingSet.Contains(current))
            {
                slots.Add(AvailabilitySlot.Create(request.LawyerId, current, end));
            }
            current = end;
        }

        if (slots.Count > 0)
        {
            await _unitOfWork.Slots.AddRangeAsync(slots);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return slots.Count;
    }
}
