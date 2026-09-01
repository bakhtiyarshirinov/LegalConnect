using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Slots.Commands.CreateSlot;

public class CreateSlotCommandHandler : IRequestHandler<CreateSlotCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateSlotCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(
        CreateSlotCommand request,
        CancellationToken cancellationToken)
    {
        var profile = await _unitOfWork.Lawyers.GetByUserIdAsync(_currentUser.UserId)
            ?? throw new ForbiddenAccessException("Only a lawyer can manage availability slots.");

        var startUtc = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(request.EndTime, DateTimeKind.Utc);

        var existing = await _unitOfWork.Slots
            .GetByLawyerIdAsync(profile.Id, startUtc, endUtc);

        if (existing.Any())
            throw new InvalidOperationException("A slot already exists in this time range");

        var slot = AvailabilitySlot.Create(profile.Id, startUtc, endUtc);
        await _unitOfWork.Slots.AddAsync(slot);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return slot.Id;
    }
}
