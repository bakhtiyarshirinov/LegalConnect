using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CreateAppointment;

public class CreateAppointmentCommandHandler
    : IRequestHandler<CreateAppointmentCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateAppointmentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(
        CreateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем что юрист существует и доступен
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);
        if (lawyer is null)
            throw new KeyNotFoundException($"Lawyer with id {request.LawyerId} not found");

        if (!lawyer.IsAvailable)
            throw new InvalidOperationException("Lawyer is not available");

        // 2️⃣ Проверяем что клиент существует
        var client = await _unitOfWork.Users.GetByIdAsync(request.ClientId);
        if (client is null)
            throw new KeyNotFoundException($"User with id {request.ClientId} not found");

        // 3️⃣ Считаем цену автоматически
        var price = lawyer.HourlyRate * (request.DurationMinutes / 60m);

        // 4️⃣ Создаём запись через фабричный метод
        var appointment = Appointment.Create(
            clientId: request.ClientId,
            lawyerId: request.LawyerId,
            scheduledAt: request.ScheduledAt,
            durationMinutes: request.DurationMinutes,
            type: request.Type,
            price: price,
            notes: request.Notes
        );

        // 5️⃣ Сохраняем
        await _unitOfWork.Appointments.AddAsync(appointment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return appointment.Id;
    }
}