using LegalConnect.Application.Common.Models;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.RegisterLawyer;

public record RegisterLawyerCommand(
    // User fields
    string FullName,
    string Email,
    string Password,
    string? Phone,
    // Lawyer profile fields
    string Bio,
    string City,
    string LicenseNumber,
    int ExperienceYears,
    decimal HourlyRate,
    IEnumerable<int> SpecializationIds
) : IRequest<AuthResult>;
