using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Appointments.Commands.CancelAppointment;

public class CancelAppointmentCommandHandler
    : IRequestHandler<CancelAppointmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<CancelAppointmentCommandHandler> _logger;

    public CancelAppointmentCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        ILogger<CancelAppointmentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task Handle(
        CancelAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException($"Appointment with id {request.AppointmentId} not found");

        // Caller identity from JWT. A client may cancel their own appointment, the
        // appointment's lawyer may cancel theirs, and an admin may cancel any.
        var callerId = _currentUser.UserId;
        var isAdmin = _currentUser.IsInRole("Admin");
        var isClient = appointment.ClientId == callerId;
        var isLawyer = appointment.Lawyer is not null && appointment.Lawyer.UserId == callerId;

        if (!isAdmin && !isClient && !isLawyer)
            throw new ForbiddenAccessException("You are not a participant of this appointment.");

        // Phase 4 conflict rules — cannot cancel a finished or already-cancelled appointment.
        if (appointment.Status == AppointmentStatus.Completed)
            throw new InvalidOperationException("Completed appointments cannot be cancelled");
        if (appointment.Status == AppointmentStatus.Cancelled)
            throw new InvalidOperationException("Appointment is already cancelled");

        appointment.Cancel(request.Reason);
        _unitOfWork.Appointments.Update(appointment);

        // Free the lawyer's slot so it can be booked again.
        if (appointment.SlotId.HasValue)
        {
            var slot = await _unitOfWork.Slots.GetByIdAsync(appointment.SlotId.Value);
            if (slot is not null)
            {
                slot.Unbook();
                _unitOfWork.Slots.Update(slot);
            }
        }

        // Notify the party/parties that did NOT initiate the cancellation. The reason,
        // when given, is included — for an appointment it is information the affected
        // side is meant to see (unlike the internal Lawyer.CancellationReason).
        var reasonSuffix = string.IsNullOrWhiteSpace(request.Reason)
            ? string.Empty
            : $" Reason: {request.Reason.Trim()}";

        if (isAdmin && !isClient && !isLawyer)
        {
            await _unitOfWork.Notifications.AddAsync(Notification.Create(
                userId: appointment.ClientId,
                title: "Appointment Cancelled",
                body: $"Your appointment has been cancelled by an administrator.{reasonSuffix}",
                type: "AppointmentCancelled"));

            if (appointment.Lawyer is not null)
            {
                await _unitOfWork.Notifications.AddAsync(Notification.Create(
                    userId: appointment.Lawyer.UserId,
                    title: "Appointment Cancelled",
                    body: $"An appointment with your client has been cancelled by an administrator.{reasonSuffix}",
                    type: "AppointmentCancelled"));
            }
        }
        else if (isClient)
        {
            await _unitOfWork.Notifications.AddAsync(Notification.Create(
                userId: appointment.Lawyer!.UserId,
                title: "Appointment Cancelled",
                body: $"The client has cancelled the appointment.{reasonSuffix}",
                type: "AppointmentCancelled"));
        }
        else // isLawyer
        {
            await _unitOfWork.Notifications.AddAsync(Notification.Create(
                userId: appointment.ClientId,
                title: "Appointment Cancelled",
                body: $"Your appointment has been cancelled by the lawyer.{reasonSuffix}",
                type: "AppointmentCancelled"));
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Appointment {AppointmentId} cancelled by {Actor} {CallerId}. ReasonProvided: {HasReason}.",
            appointment.Id,
            isAdmin && !isClient && !isLawyer ? "admin" : isClient ? "client" : "lawyer",
            callerId,
            !string.IsNullOrWhiteSpace(request.Reason));
    }
}
