using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Lawyers.Commands.CreateLawyerProfile;

public class CreateLawyerProfileCommandHandler
    : IRequestHandler<CreateLawyerProfileCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateLawyerProfileCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(
        CreateLawyerProfileCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем что юзер существует
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);
        if (user is null)
            throw new KeyNotFoundException($"User with id {request.UserId} not found");

        // 2️⃣ Проверяем что у юзера ещё нет профиля юриста
        var existingProfile = await _unitOfWork.Lawyers.GetByUserIdAsync(request.UserId);
        if (existingProfile is not null)
            throw new InvalidOperationException("Lawyer profile already exists for this user");

        // 3️⃣ Проверяем что все специализации существуют
        foreach (var specializationId in request.SpecializationIds)
        {
            var exists = await _unitOfWork.Specializations.ExistsAsync(specializationId);
            if (!exists)
                throw new KeyNotFoundException(
                    $"Specialization with id {specializationId} not found");
        }

        // 4️⃣ Создаём профиль через фабричный метод
        var lawyer = Lawyer.Create(
            userId: request.UserId,
            bio: request.Bio,
            city: request.City,
            licenseNumber: request.LicenseNumber,
            experienceYears: request.ExperienceYears,
            hourlyRate: request.HourlyRate
        );

        // 5️⃣ Добавляем специализации
        foreach (var specializationId in request.SpecializationIds)
        {
            var specialization = LawyerSpecialization.Create(lawyer.Id, specializationId);
            lawyer.Specializations.Add(specialization);
        }

        // 6️⃣ Сохраняем
        await _unitOfWork.Lawyers.AddAsync(lawyer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return lawyer.Id;
    }
}