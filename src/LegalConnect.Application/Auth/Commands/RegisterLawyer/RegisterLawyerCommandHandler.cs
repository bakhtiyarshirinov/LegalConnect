using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Common.Models;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Auth.Commands.RegisterLawyer;

public class RegisterLawyerCommandHandler : IRequestHandler<RegisterLawyerCommand, AuthResult>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;

    public RegisterLawyerCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
    }

    public async Task<AuthResult> Handle(
        RegisterLawyerCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Check email uniqueness
        var emailExists = await _unitOfWork.Users.ExistsByEmailAsync(request.Email);
        if (emailExists)
            throw new InvalidOperationException("User with this email already exists");

        // 2️⃣ Validate all specializations exist
        foreach (var specializationId in request.SpecializationIds)
        {
            var exists = await _unitOfWork.Specializations.ExistsAsync(specializationId);
            if (!exists)
                throw new KeyNotFoundException(
                    $"Specialization with id {specializationId} not found");
        }

        // 3️⃣ Create user with Lawyer role
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = User.Create(
            email: request.Email,
            passwordHash: passwordHash,
            fullName: request.FullName,
            role: UserRole.Lawyer,
            phone: request.Phone
        );

        await _unitOfWork.Users.AddAsync(user);

        // 4️⃣ Create basic LawyerProfile (IsVerified = false by default)
        var lawyer = Lawyer.Create(
            userId: user.Id,
            bio: request.Bio,
            city: request.City,
            licenseNumber: request.LicenseNumber,
            experienceYears: request.ExperienceYears,
            hourlyRate: request.HourlyRate
        );

        foreach (var specializationId in request.SpecializationIds)
            lawyer.Specializations.Add(LawyerSpecialization.Create(lawyer.Id, specializationId));

        await _unitOfWork.Lawyers.AddAsync(lawyer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5️⃣ Return token
        var token = _jwtService.GenerateToken(user);

        return new AuthResult(
            UserId: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Role: user.Role.ToString(),
            Token: token,
            ExpiresAt: _jwtService.GetExpiration()
        );
    }
}
