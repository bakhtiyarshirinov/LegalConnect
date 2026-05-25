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
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
