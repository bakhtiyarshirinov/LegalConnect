using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Specializations.Queries.GetSpecializations;

public class GetSpecializationsQueryHandler
    : IRequestHandler<GetSpecializationsQuery, IEnumerable<SpecializationDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetSpecializationsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<SpecializationDto>> Handle(
        GetSpecializationsQuery request,
        CancellationToken cancellationToken)
    {
        var specializations = await _unitOfWork.Specializations.GetAllAsync();

        return specializations.Select(s => new SpecializationDto(
            Id: s.Id,
            Name: s.Name,
            Description: s.Description
        ));
    }
}