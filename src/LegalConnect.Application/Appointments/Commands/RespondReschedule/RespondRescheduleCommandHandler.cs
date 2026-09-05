using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Appointments.Commands.RespondReschedule;

public class RespondRescheduleCommandHandler : IRequestHandler<RespondRescheduleCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<RespondRescheduleCommandHandler> _logger;

    public RespondRescheduleCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        ILogger<RespondRescheduleCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task Handle(RespondRescheduleCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);
        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        if (appointment.RescheduleStatus != RescheduleStatus.Pending)
            throw new InvalidOperationException("There is no pending reschedule request for this appointment");

        var callerId = _currentUser.UserId;
        var isClient = appointment.ClientId == callerId;
        var isLawyer = appointment.Lawyer is not null && appointment.Lawyer.UserId == callerId;
        if (!isClient && !isLawyer)
            throw new ForbiddenAccessException("You are not a participant of this appointment.");

        // The proposer cannot answer their own request.
        if (appointment.ProposedByUserId == callerId)
            throw new ForbiddenAccessException("The party that proposed the reschedule cannot respond to it.");

        var proposerUserId = appointment.ProposedByUserId!.Value;
        var reasonSuffix = string.IsNullOrWhiteSpace(request.Reason)
            ? string.Empty
            : $" Reason: {request.Reason.Trim()}";

        if (request.Accept)
        {
            var newTime = appointment.ProposedScheduledAt!.Value;
            appointment.AcceptReschedule();
            _unitOfWork.Appointments.Update(appointment);

            // Both parties learn the new time.
            foreach (var userId in new[] { appointment.ClientId, appointment.Lawyer!.UserId })
            {
                await _unitOfWork.Notifications.AddAsync(Notification.Create(
                    userId: userId,
                    title: "Görüş vaxtı yeniləndi",
                    body: $"The appointment has been moved to {newTime:yyyy-MM-dd HH:mm} (UTC).",
                    type: "RescheduleAccepted"));
            }
        }
        else
        {
            appointment.RejectReschedule();
            _unitOfWork.Appointments.Update(appointment);

            // Only the proposer is notified of the rejection.
            await _unitOfWork.Notifications.AddAsync(Notification.Create(
                userId: proposerUserId,
                title: "Vaxt dəyişikliyi təklifi rədd edildi",
                body: $"Your reschedule proposal was rejected. The appointment time is unchanged.{reasonSuffix}",
                type: "RescheduleRejected"));
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Reschedule for appointment {AppointmentId} {Outcome} by {CallerId}.",
            appointment.Id, request.Accept ? "accepted" : "rejected", callerId);
    }
}
