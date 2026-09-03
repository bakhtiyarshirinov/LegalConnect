using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CreateAppointment;

public class CreateAppointmentCommandHandler
    : IRequestHandler<CreateAppointmentCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateAppointmentCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(
        CreateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        // Клиент — это текущий пользователь из JWT
        var clientId = _currentUser.UserId;
        if (_currentUser.IsInRole("Lawyer") || _currentUser.IsInRole("Admin"))
            throw new ForbiddenAccessException("Only clients can book appointments.");

        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);
        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        // Verified check runs first — a de-verified lawyer must not be bookable via any
        // path (direct LawyerId, known slotId, stale UI). Neutral message: do not disclose
        // the verification-cancellation fact/reason to clients.
        if (!lawyer.IsVerified)
            throw new BadRequestException("This lawyer is not currently available for booking");

        if (!lawyer.IsAvailable)
            throw new BadRequestException("Lawyer is not available");

        var client = await _unitOfWork.Users.GetByIdAsync(clientId);
        if (client is null)
            throw new KeyNotFoundException($"User with id {clientId} not found");

        DateTime scheduledAt = request.ScheduledAt;
        int durationMinutes = request.DurationMinutes;
        Guid? slotId = request.SlotId;
        AvailabilitySlot? slot = null;

        if (request.SlotId.HasValue)
        {
            slot = await _unitOfWork.Slots.GetByIdAsync(request.SlotId.Value);
            if (slot is null)
                throw new KeyNotFoundException($"Slot with id {request.SlotId} not found");
            if (slot.LawyerId != request.LawyerId)
                throw new BadRequestException("Slot does not belong to this lawyer");
            if (slot.IsBooked)
                throw new InvalidOperationException("This slot is already booked");

            scheduledAt = slot.StartTime;
            durationMinutes = (int)(slot.EndTime - slot.StartTime).TotalMinutes;
            slotId = slot.Id;
        }

        var price = lawyer.HourlyRate * (durationMinutes / 60m);

        var appointment = Appointment.Create(
            clientId: clientId,
            lawyerId: request.LawyerId,
            scheduledAt: scheduledAt,
            durationMinutes: durationMinutes,
            type: request.Type,
            price: price,
            notes: request.Notes,
            slotId: slotId
        );

        await _unitOfWork.Appointments.AddAsync(appointment);

        if (slot is not null)
        {
            slot.Book(appointment.Id);
            _unitOfWork.Slots.Update(slot);
        }

        // Notify the lawyer of the new booking — same transaction, not fire-and-forget.
        await _unitOfWork.Notifications.AddAsync(Notification.Create(
            userId: lawyer.UserId,
            title: "New Appointment",
            body: $"{client.FullName} booked an appointment for {scheduledAt:MMM d, yyyy HH:mm}.",
            type: "appointment"));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return appointment.Id;
    }
}
