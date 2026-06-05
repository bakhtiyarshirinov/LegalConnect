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
        var date = request.Date.Date;
        var slotStart = new DateTime(date.Year, date.Month, date.Day, request.StartHour, 0, 0, DateTimeKind.Utc);
        var dayEnd = new DateTime(date.Year, date.Month, date.Day, request.EndHour, 0, 0, DateTimeKind.Utc);

        var existing = await _unitOfWork.Slots
            .GetByLawyerIdAsync(request.LawyerId, slotStart, dayEnd);
        var existingSet = existing.Select(s => s.StartTime).ToHashSet();

        var slots = new List<AvailabilitySlot>();

        while (slotStart.AddMinutes(request.SlotDurationMinutes) <= dayEnd)
        {
            var slotEnd = slotStart.AddMinutes(request.SlotDurationMinutes);
            if (!existingSet.Contains(slotStart))
            {
                slots.Add(AvailabilitySlot.Create(request.LawyerId, slotStart, slotEnd));
            }
            slotStart = slotEnd;
        }

        if (slots.Count > 0)
        {
            await _unitOfWork.Slots.AddRangeAsync(slots);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return slots.Count;
    }
}
