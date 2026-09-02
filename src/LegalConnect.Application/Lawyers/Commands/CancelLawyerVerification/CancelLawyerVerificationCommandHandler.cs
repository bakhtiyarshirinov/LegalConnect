using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Lawyers.Commands.CancelLawyerVerification;

public class CancelLawyerVerificationCommandHandler
    : IRequestHandler<CancelLawyerVerificationCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CancelLawyerVerificationCommandHandler> _logger;

    public CancelLawyerVerificationCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<CancelLawyerVerificationCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task Handle(
        CancelLawyerVerificationCommand request,
        CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);

        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        // Distinct from "never verified" / "rejected on intake": this only revokes an
        // active verification. If the lawyer is not currently verified there is nothing
        // to cancel — the primary verify/approve flow handles the other direction.
        if (!lawyer.IsVerified)
            throw new BadRequestException("Lawyer is not currently verified");

        lawyer.CancelVerification(request.Reason);
        _unitOfWork.Lawyers.Update(lawyer);

        // In-app notification for the lawyer, persisted in the same unit of work.
        await _unitOfWork.Notifications.AddAsync(Notification.Create(
            userId: lawyer.UserId,
            title: "Verifikasiya ləğv edildi",
            body: $"Vəkil verifikasiyanız administrator tərəfindən ləğv edildi. Səbəb: {request.Reason}",
            type: "verification_cancelled"));

        // Existing appointments are NOT auto-cancelled (deliberate — see phase report):
        // verification may be revoked for a formal reason that does not endanger already
        // agreed meetings. Instead notify each affected client so they can decide and
        // cancel themselves via the existing PUT /appointments/{id}/cancel flow.
        // Wording is neutral — CancellationReason is internal and must not leak to clients.
        var appointments = await _unitOfWork.Appointments.GetByLawyerIdAsync(lawyer.Id);
        var affectedClientIds = appointments
            .Where(a => a.Status is AppointmentStatus.Pending or AppointmentStatus.Confirmed)
            .Select(a => a.ClientId)
            .Distinct()
            .ToList();

        foreach (var clientId in affectedClientIds)
        {
            await _unitOfWork.Notifications.AddAsync(Notification.Create(
                userId: clientId,
                title: "Vəkilin statusu dəyişdi",
                body: $"Vəkil {lawyer.User.FullName}, planlaşdırdığınız görüş üçün, hazırda verifikasiya olunmayıb. " +
                      "Zəhmət olmasa dəstək xidməti ilə əlaqə saxlayın və ya başqa vəkil seçin.",
                type: "lawyer_unverified"));
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Lawyer {LawyerId} verification cancelled by admin. Reason: {Reason}. Notified {ClientCount} client(s) with active appointments.",
            lawyer.Id, request.Reason, affectedClientIds.Count);
    }
}
