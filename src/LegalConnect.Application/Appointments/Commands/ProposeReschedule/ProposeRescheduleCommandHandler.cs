using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Appointments.Commands.ProposeReschedule;

public class ProposeRescheduleCommandHandler : IRequestHandler<ProposeRescheduleCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<ProposeRescheduleCommandHandler> _logger;

    public ProposeRescheduleCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        ILogger<ProposeRescheduleCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task Handle(ProposeRescheduleCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);
        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        var callerId = _currentUser.UserId;
        var isClient = appointment.ClientId == callerId;
        var isLawyer = appointment.Lawyer is not null && appointment.Lawyer.UserId == callerId;
        if (!isClient && !isLawyer)
            throw new ForbiddenAccessException("You are not a participant of this appointment.");

        if (appointment.Status is AppointmentStatus.Cancelled or AppointmentStatus.Completed)
            throw new InvalidOperationException("Only an active appointment can be rescheduled");

        if (appointment.RescheduleStatus == RescheduleStatus.Pending)
            throw new InvalidOperationException("A reschedule request is already pending for this appointment");

        appointment.ProposeReschedule(request.NewScheduledAt, callerId, request.Reason);
        _unitOfWork.Appointments.Update(appointment);

        // Notify the OTHER party — they respond via RespondRescheduleCommand.
        var recipientUserId = isClient ? appointment.Lawyer!.UserId : appointment.ClientId;
        var initiatorLabel = isClient ? "The client" : "The lawyer";
        var reasonSuffix = string.IsNullOrWhiteSpace(request.Reason)
            ? string.Empty
            : $" Reason: {request.Reason.Trim()}";

        await _unitOfWork.Notifications.AddAsync(Notification.Create(
            userId: recipientUserId,
            title: "Perenos təklif olunub",
            body: $"{initiatorLabel} proposed to move the appointment to " +
                  $"{appointment.ProposedScheduledAt:yyyy-MM-dd HH:mm} (UTC).{reasonSuffix} " +
                  "Open the appointment to accept or reject.",
            type: "RescheduleProposed"));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Reschedule proposed for appointment {AppointmentId} by {CallerId} to {ProposedAt}.",
            appointment.Id, callerId, appointment.ProposedScheduledAt);
    }
}
