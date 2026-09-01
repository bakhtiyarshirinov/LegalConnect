using MediatR;

namespace LegalConnect.Application.Reviews.Commands.CreateReview;

/// <summary>Client id is taken from the JWT in the handler, never from the request body.</summary>
public record CreateReviewCommand(
    Guid LawyerId,
    Guid AppointmentId,
    int Rating,
    string? Comment
) : IRequest<Guid>;
