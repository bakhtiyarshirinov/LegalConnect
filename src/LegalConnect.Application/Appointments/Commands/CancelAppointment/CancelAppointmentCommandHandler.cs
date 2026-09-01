using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Notifications.Commands.CreateNotification;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CancelAppointment;

public class CancelAppointmentCommandHandler
    : IRequestHandler<CancelAppointmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public CancelAppointmentCommandHandler(
        IUnitOfWork unitOfWork,
        IMediator mediator,
        ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
        _currentUser = currentUser;
    }

    public async Task Handle(
        CancelAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        // Кто звонит — берём из JWT. Отменить может клиент записи или её юрист.
        var callerId = _currentUser.UserId;
        var isClient = appointment.ClientId == callerId;
        var isLawyer = appointment.Lawyer is not null && appointment.Lawyer.UserId == callerId;

        if (!isClient && !isLawyer)
            throw new ForbiddenAccessException("You are not a participant of this appointment.");

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

        if (isClient)
        {
            await _mediator.Send(new CreateNotificationCommand(
                UserId: appointment.Lawyer!.UserId,
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
