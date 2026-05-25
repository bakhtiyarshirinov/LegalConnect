using MediatR;

namespace LegalConnect.Application.Admin.Commands.VerifyLawyer;

public record VerifyLawyerCommand(Guid LawyerId) : IRequest;
