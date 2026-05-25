using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CancelAppointment;

public class CancelAppointmentCommandHandler
    : IRequestHandler<CancelAppointmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public CancelAppointmentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(
        CancelAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        // Отменить может клиент ИЛИ юрист
        if (appointment.ClientId != request.UserId && appointment.LawyerId != request.UserId)
            throw new InvalidOperationException("You are not authorized to cancel this appointment");

        if (appointment.Status == Domain.Enums.AppointmentStatus.Completed)
            throw new InvalidOperationException("Completed appointments cannot be cancelled");

        appointment.Cancel();
        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}