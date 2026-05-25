using MediatR;

namespace LegalConnect.Application.Reviews.Queries.GetLawyerReviews;

public record GetLawyerReviewsQuery(Guid LawyerId)
    : IRequest<IEnumerable<ReviewDto>>;