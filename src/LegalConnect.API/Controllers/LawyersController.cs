using LegalConnect.Application.Lawyers.Queries.GetLawyers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LawyersController : ControllerBase
{
    private readonly IMediator _mediator;

    public LawyersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetLawyers(
        [FromQuery] string? city,
        [FromQuery] int? specializationId,
        [FromQuery] decimal? maxRate,
        CancellationToken cancellationToken)
    {
        var query = new GetLawyersQuery(city, specializationId, maxRate);
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}