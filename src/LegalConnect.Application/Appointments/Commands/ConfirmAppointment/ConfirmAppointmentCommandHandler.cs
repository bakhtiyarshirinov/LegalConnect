using LegalConnect.Application.Notifications.Commands.CreateNotification;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.ConfirmAppointment;

public class ConfirmAppointmentCommandHandler
    : IRequestHandler<ConfirmAppointmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public ConfirmAppointmentCommandHandler(IUnitOfWork unitOfWork, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
    }

    public async Task Handle(
        ConfirmAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        // Только юрист этой записи может подтвердить
        if (appointment.LawyerId != request.LawyerId)
            throw new InvalidOperationException("You are not authorized to confirm this appointment");

        if (appointment.Status != Domain.Enums.AppointmentStatus.Pending)
            throw new InvalidOperationException("Only pending appointments can be confirmed");

        appointment.Confirm();
        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Уведомляем клиента о подтверждении записи
        await _mediator.Send(new CreateNotificationCommand(
            UserId: appointment.ClientId,
            Title: "Appointment Confirmed",
            Body: "Your appointment has been confirmed by the lawyer",
            Type: "appointment"), cancellationToken);
    }
}
