using MediatR;

namespace LegalConnect.Application.Lawyers.Commands.UpdateLawyerSpecializations;

public record UpdateLawyerSpecializationsCommand(Guid UserId, int[] SpecializationIds) : IRequest;
