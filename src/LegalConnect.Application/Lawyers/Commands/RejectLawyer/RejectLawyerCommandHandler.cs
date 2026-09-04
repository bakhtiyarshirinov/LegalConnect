using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Lawyers.Commands.RejectLawyer;

public class RejectLawyerCommandHandler : IRequestHandler<RejectLawyerCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RejectLawyerCommandHandler> _logger;

    public RejectLawyerCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<RejectLawyerCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task Handle(RejectLawyerCommand request, CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);

        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        // Reject only applies to a pending application. A verified lawyer must be
        // handled through cancel-verification instead.
        if (lawyer.IsVerified)
            throw new BadRequestException(
                "Lawyer is already verified. Use cancel-verification to revoke it.");

        if (lawyer.RejectedAt is not null)
            throw new BadRequestException("Lawyer application is already rejected.");

        lawyer.Reject(request.Reason);
        _unitOfWork.Lawyers.Update(lawyer);

        await _unitOfWork.Notifications.AddAsync(Notification.Create(
            userId: lawyer.UserId,
            title: "Müraciətiniz rədd edildi",
            body: $"Vəkil verifikasiya müraciətiniz administrator tərəfindən rədd edildi. Səbəb: {request.Reason}. " +
                  "Profilinizi yeniləyərək təkrar müraciət edə bilərsiniz.",
            type: "application_rejected"));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Lawyer {LawyerId} application rejected by admin. Reason: {Reason}.",
            lawyer.Id, request.Reason);
    }
}
