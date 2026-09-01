using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Application.Common.Models;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Auth.Commands.RegisterLawyer;

public class RegisterLawyerCommandHandler : IRequestHandler<RegisterLawyerCommand, AuthResult>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly ILogger<RegisterLawyerCommandHandler> _logger;

    public RegisterLawyerCommandHandler(
        IUnitOfWork unitOfWork,
        IJwtService jwtService,
        IEmailService emailService,
        ILogger<RegisterLawyerCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<AuthResult> Handle(
        RegisterLawyerCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем уникальность email
        var emailExists = await _unitOfWork.Users.ExistsByEmailAsync(request.Email);
        if (emailExists)
            throw new InvalidOperationException("Unable to complete registration with the provided details.");

        // 2️⃣ Проверяем существование специализаций
        foreach (var specializationId in request.SpecializationIds)
        {
            var exists = await _unitOfWork.Specializations.ExistsAsync(specializationId);
            if (!exists)
                throw new KeyNotFoundException(
                    $"Specialization with id {specializationId} not found");
        }

        // 3️⃣ Создаём пользователя с ролью Lawyer (IsVerified = false)
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = User.Create(
            email: request.Email,
            passwordHash: passwordHash,
            fullName: request.FullName,
            role: UserRole.Lawyer,
            phone: request.Phone
        );

        await _unitOfWork.Users.AddAsync(user);

        // 4️⃣ Создаём профиль юриста
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

        // 5️⃣ Генерируем OTP-код
        var code = Random.Shared.Next(100000, 999999).ToString();
        var otpCode = OtpCode.Create(user.Email, code);
        await _unitOfWork.OtpCodes.AddAsync(otpCode);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 6️⃣ Отправляем email с кодом (fire-and-forget)
        var userIdForLog = user.Id;
        _ = Task.Run(async () =>
        {
            try { await _emailService.SendOtpAsync(user.Email, user.FullName, code); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send registration OTP e-mail for lawyer user {UserId}", userIdForLog);
            }
        });

        
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
