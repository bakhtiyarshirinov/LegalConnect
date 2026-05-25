using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Reviews.Commands.CreateReview;

public class CreateReviewCommandHandler
    : IRequestHandler<CreateReviewCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateReviewCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(
        CreateReviewCommand request,
        CancellationToken cancellationToken)
    {
        // 1️⃣ Проверяем что appointment существует и завершён
        var appointment = await _unitOfWork.Appointments
            .GetByIdAsync(request.AppointmentId);

        if (appointment is null)
            throw new KeyNotFoundException(
                $"Appointment with id {request.AppointmentId} not found");

        if (appointment.Status != Domain.Enums.AppointmentStatus.Completed)
            throw new InvalidOperationException(
                "You can only review completed appointments");

        // 2️⃣ Проверяем что клиент — именно тот кто был на приёме
        if (appointment.ClientId != request.ClientId)
            throw new InvalidOperationException(
                "You are not authorized to review this appointment");

        // 3️⃣ Проверяем что отзыв ещё не оставлен
        var alreadyReviewed = await _unitOfWork.Reviews
            .ExistsByAppointmentIdAsync(request.AppointmentId);

        if (alreadyReviewed)
            throw new InvalidOperationException(
                "You have already reviewed this appointment");

        // 4️⃣ Создаём отзыв — валидация рейтинга уже внутри Create()!
        var review = Review.Create(
            clientId: request.ClientId,
            lawyerId: request.LawyerId,
            appointmentId: request.AppointmentId,
            rating: request.Rating,
            comment: request.Comment
        );

        await _unitOfWork.Reviews.AddAsync(review);

        // 5️⃣ Пересчитываем рейтинг юриста
        var lawyer = await _unitOfWork.Lawyers.GetByIdAsync(request.LawyerId);
        if (lawyer is not null)
        {
            var allReviews = await _unitOfWork.Reviews
                .GetByLawyerIdAsync(request.LawyerId);

            var newReviewCount = allReviews.Count() + 1;
            var totalRating = allReviews.Sum(r => r.Rating) + request.Rating;
            var newRating = (float)totalRating / newReviewCount;

            lawyer.UpdateRating(newRating, newReviewCount);
            _unitOfWork.Lawyers.Update(lawyer);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return review.Id;
    }
}