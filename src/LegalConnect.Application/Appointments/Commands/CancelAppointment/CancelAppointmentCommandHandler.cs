using LegalConnect.Application.Notifications.Commands.CreateNotification;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CancelAppointment;

public class CancelAppointmentCommandHandler
    : IRequestHandler<CancelAppointmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public CancelAppointmentCommandHandler(IUnitOfWork unitOfWork, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
    }

    public async Task Handle(
        CancelAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        if (appointment.ClientId != request.UserId && appointment.LawyerId != request.UserId)
            throw new InvalidOperationException("You are not authorized to cancel this appointment");

        if (appointment.Status == Domain.Enums.AppointmentStatus.Completed)
            throw new InvalidOperationException("Completed appointments cannot be cancelled");

        appointment.Cancel();
        _unitOfWork.Appointments.Update(appointment);

        if (appointment.SlotId.HasValue)
        {
            var slot = await _unitOfWork.Slots.GetByIdAsync(appointment.SlotId.Value);
            if (slot is not null)
            {
                slot.Unbook();
                _unitOfWork.Slots.Update(slot);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var isClientCancelling = appointment.ClientId == request.UserId;

        if (isClientCancelling)
        {
            await _mediator.Send(new CreateNotificationCommand(
                UserId: appointment.Lawyer.UserId,
                Title: "Appointment Cancelled",
                Body: "The client has cancelled the appointment",
                Type: "appointment"), cancellationToken);
        }
        else
        {
            await _mediator.Send(new CreateNotificationCommand(
                UserId: appointment.ClientId,
                Title: "Appointment Cancelled",
                Body: "Your appointment has been cancelled by the lawyer",
                Type: "appointment"), cancellationToken);
        }
    }
}
