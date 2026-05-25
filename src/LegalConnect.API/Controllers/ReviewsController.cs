using LegalConnect.Application.Reviews.Commands.CreateReview;
using LegalConnect.Application.Reviews.Queries.GetLawyerReviews;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReviewsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReview(
        [FromBody] CreateReviewCommand command,
        CancellationToken cancellationToken)
    {
        var reviewId = await _mediator.Send(command, cancellationToken);
        return Ok(new { reviewId });
    }

    [HttpGet("lawyer/{lawyerId:guid}")]
    public async Task<IActionResult> GetLawyerReviews(
        Guid lawyerId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetLawyerReviewsQuery(lawyerId), cancellationToken);
        return Ok(result);
    }
}