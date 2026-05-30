using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Lawyers.Commands.UpdateLawyerSpecializations;

public class UpdateLawyerSpecializationsCommandHandler : IRequestHandler<UpdateLawyerSpecializationsCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateLawyerSpecializationsCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateLawyerSpecializationsCommand request, CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByUserIdAsync(request.UserId);

        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer profile not found for user {request.UserId}");

        foreach (var spec in lawyer.Specializations.ToList())
            _unitOfWork.Lawyers.RemoveSpecialization(spec);

        foreach (var specId in request.SpecializationIds)
            await _unitOfWork.Lawyers.AddSpecializationAsync(LawyerSpecialization.Create(lawyer.Id, specId));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
