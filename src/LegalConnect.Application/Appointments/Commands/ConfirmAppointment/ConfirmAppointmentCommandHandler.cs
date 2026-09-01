using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Notifications.Commands.CreateNotification;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.ConfirmAppointment;

public class ConfirmAppointmentCommandHandler
    : IRequestHandler<ConfirmAppointmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ConfirmAppointmentCommandHandler(
        IUnitOfWork unitOfWork,
        IMediator mediator,
        ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
        _currentUser = currentUser;
    }

    public async Task Handle(
        ConfirmAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        // Только юрист этой записи может подтвердить — профиль берём по JWT, не из запроса
        var profile = await _unitOfWork.Lawyers.GetByUserIdAsync(_currentUser.UserId);
        if (profile is null || appointment.LawyerId != profile.Id)
            throw new ForbiddenAccessException("You are not the lawyer for this appointment.");

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
