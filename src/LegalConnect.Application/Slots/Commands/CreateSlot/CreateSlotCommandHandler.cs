using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Commands.CreateSlot;

public class CreateSlotCommandHandler : IRequestHandler<CreateSlotCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateSlotCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(
        CreateSlotCommand request,
        CancellationToken cancellationToken)
    {
        var startUtc = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(request.EndTime, DateTimeKind.Utc);

        var existing = await _unitOfWork.Slots
            .GetByLawyerIdAsync(request.LawyerId, startUtc, endUtc);

        if (existing.Any())
            throw new InvalidOperationException("A slot already exists in this time range");

        var slot = AvailabilitySlot.Create(request.LawyerId, startUtc, endUtc);
        await _unitOfWork.Slots.AddAsync(slot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return slot.Id;
    }
}
