using LegalConnect.Application.Notifications.Commands.CreateNotification;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CompleteAppointment;

public class CompleteAppointmentCommandHandler
    : IRequestHandler<CompleteAppointmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public CompleteAppointmentCommandHandler(IUnitOfWork unitOfWork, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
    }

    public async Task Handle(
        CompleteAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        if (appointment.LawyerId != request.LawyerId)
            throw new InvalidOperationException("You are not authorized to complete this appointment");

        if (appointment.Status != Domain.Enums.AppointmentStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed appointments can be completed");

        appointment.Complete();
        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _mediator.Send(new CreateNotificationCommand(
            UserId: appointment.ClientId,
            Title: "Appointment Completed",
            Body: "Your appointment has been marked as completed",
            Type: "appointment"), cancellationToken);
    }
}
