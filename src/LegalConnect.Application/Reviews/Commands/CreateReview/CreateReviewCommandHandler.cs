using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Reviews.Commands.CreateReview;

public class CreateReviewCommandHandler
    : IRequestHandler<CreateReviewCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateReviewCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(
        CreateReviewCommand request,
        CancellationToken cancellationToken)
    {
        var clientId = _currentUser.UserId;

        // 1️⃣ Appointment существует и завершён
        var appointment = await _unitOfWork.Appointments
            .GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException(
                $"Appointment with id {request.AppointmentId} not found");

        if (appointment.Status != Domain.Enums.AppointmentStatus.Completed)
            throw new BadRequestException(
                "You can only review completed appointments");

        // 2️⃣ Отзыв оставляет только клиент этой записи (id — из JWT)
        if (appointment.ClientId != clientId)
            throw new ForbiddenAccessException(
                "You can only review your own appointments.");

        // 3️⃣ LawyerId в запросе обязан совпадать с юристом записи (иначе накрутка чужого рейтинга)
        if (request.LawyerId != appointment.LawyerId)
            throw new BadRequestException(
                "LawyerId does not match the lawyer of this appointment.");

        // 4️⃣ Повторный отзыв запрещён
        var alreadyReviewed = await _unitOfWork.Reviews
            .ExistsByAppointmentIdAsync(request.AppointmentId);

        if (alreadyReviewed)
            throw new InvalidOperationException(
                "You have already reviewed this appointment");

        // 5️⃣ Создаём отзыв
        var review = Review.Create(
            clientId: clientId,
            lawyerId: appointment.LawyerId,
            appointmentId: request.AppointmentId,
            rating: request.Rating,
            comment: request.Comment
        );

        await _unitOfWork.Reviews.AddAsync(review);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 6️⃣ Рейтинг юриста — чистая функция от строк таблицы reviews:
        //     полный пересчёт из фактических отзывов, без "накопительных" формул
        //     и без опоры на сид-значения ReviewCount/Rating.
        await RecalculateLawyerRatingAsync(appointment.LawyerId, cancellationToken);

        return review.Id;
    }

    private async Task RecalculateLawyerRatingAsync(Guid lawyerId, CancellationToken cancellationToken)
    {
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(lawyerId);
        if (lawyer is null) return;

        var reviews = (await _unitOfWork.Reviews.GetByLawyerIdAsync(lawyerId)).ToList();
        var count = reviews.Count;
        var average = count == 0
            ? 0f
            : (float)Math.Round(reviews.Average(r => r.Rating), 2);

        lawyer.UpdateRating(average, count);
        _unitOfWork.Lawyers.Update(lawyer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
