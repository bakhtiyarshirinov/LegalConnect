using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Admin.Commands.VerifyLawyer;

public class VerifyLawyerCommandHandler : IRequestHandler<VerifyLawyerCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public VerifyLawyerCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(
        VerifyLawyerCommand request,
        CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);

        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        if (lawyer.IsVerified)
            throw new InvalidOperationException("Lawyer is already verified");

        lawyer.Verify();
        _unitOfWork.Lawyers.Update(lawyer);

        // Notify the lawyer that their account is now verified (status change) —
        // mirrors the "verification_cancelled" notification, same transaction.
        await _unitOfWork.Notifications.AddAsync(Notification.Create(
            userId: lawyer.UserId,
            title: "Hesabınız təsdiqləndi",
            body: "Vəkil hesabınız administrator tərəfindən təsdiqləndi. Artıq müştərilər sizinlə görüş təyin edə bilər.",
            type: "lawyer_verified"));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
