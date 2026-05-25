using MediatR;

namespace LegalConnect.Application.Reviews.Commands.CreateReview;

public record CreateReviewCommand(
    Guid ClientId,
    Guid LawyerId,
    Guid AppointmentId,
    int Rating,
    string? Comment
) : IRequest<Guid>;