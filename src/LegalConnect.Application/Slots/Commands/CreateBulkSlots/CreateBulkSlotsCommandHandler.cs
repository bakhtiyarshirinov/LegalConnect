using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Commands.CreateBulkSlots;

public class CreateBulkSlotsCommandHandler : IRequestHandler<CreateBulkSlotsCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateBulkSlotsCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<int> Handle(
        CreateBulkSlotsCommand request,
        CancellationToken cancellationToken)
    {
        var profile = await _unitOfWork.Lawyers.GetByUserIdAsync(_currentUser.UserId)
            ?? throw new ForbiddenAccessException("Only a lawyer can manage availability slots.");

        var date = request.Date.Date;
        var slotStart = new DateTime(date.Year, date.Month, date.Day, request.StartHour, 0, 0, DateTimeKind.Utc);
        var dayEnd = new DateTime(date.Year, date.Month, date.Day, request.EndHour, 0, 0, DateTimeKind.Utc);

        var existing = await _unitOfWork.Slots
            .GetByLawyerIdAsync(profile.Id, slotStart, dayEnd);
        var existingSet = existing.Select(s => s.StartTime).ToHashSet();

        var slots = new List<AvailabilitySlot>();

        while (slotStart.AddMinutes(request.SlotDurationMinutes) <= dayEnd)
        {
            var slotEnd = slotStart.AddMinutes(request.SlotDurationMinutes);
            if (!existingSet.Contains(slotStart))
            {
                slots.Add(AvailabilitySlot.Create(profile.Id, slotStart, slotEnd));
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
