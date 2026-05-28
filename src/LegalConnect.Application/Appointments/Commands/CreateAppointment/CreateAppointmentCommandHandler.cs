using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CreateAppointment;

public class CreateAppointmentCommandHandler
    : IRequestHandler<CreateAppointmentCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateAppointmentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(
        CreateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);
        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        if (!lawyer.IsAvailable)
            throw new InvalidOperationException("Lawyer is not available");

        var client = await _unitOfWork.Users.GetByIdAsync(request.ClientId);
        if (client is null)
            throw new KeyNotFoundException($"User with id {request.ClientId} not found");

        DateTime scheduledAt = request.ScheduledAt;
        int durationMinutes = request.DurationMinutes;
        Guid? slotId = request.SlotId;
        AvailabilitySlot? slot = null;

        if (request.SlotId.HasValue)
        {
            slot = await _unitOfWork.Slots.GetByIdAsync(request.SlotId.Value);
            if (slot is null)
                throw new KeyNotFoundException($"Slot with id {request.SlotId} not found");
            if (slot.IsBooked)
                throw new InvalidOperationException("This slot is already booked");

            scheduledAt = slot.StartTime;
            durationMinutes = (int)(slot.EndTime - slot.StartTime).TotalMinutes;
            slotId = slot.Id;
        }

        var price = lawyer.HourlyRate * (durationMinutes / 60m);

        var appointment = Appointment.Create(
            clientId: request.ClientId,
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

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return appointment.Id;
    }
}
