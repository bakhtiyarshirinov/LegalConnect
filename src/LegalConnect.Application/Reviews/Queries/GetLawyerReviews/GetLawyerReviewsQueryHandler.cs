using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Reviews.Queries.GetLawyerReviews;

public class GetLawyerReviewsQueryHandler
    : IRequestHandler<GetLawyerReviewsQuery, IEnumerable<ReviewDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLawyerReviewsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ReviewDto>> Handle(
        GetLawyerReviewsQuery request,
        CancellationToken cancellationToken)
    {
        var reviews = await _unitOfWork.Reviews
            .GetByLawyerIdAsync(request.LawyerId);

        return reviews.Select(r => new ReviewDto(
            Id: r.Id,
            ClientFullName: r.Client.FullName,
            Rating: r.Rating,
            Comment: r.Comment,
            CreatedAt: r.CreatedAt
        ));
    }
}