using LegalConnect.Application.Lawyers.Commands.CreateLawyerProfile;
using LegalConnect.Application.Lawyers.Queries.GetLawyerById;
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
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetLawyerById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var query = new GetLawyerByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }
    
    [HttpPost]
    public async Task<IActionResult> CreateLawyerProfile(
        [FromBody] CreateLawyerProfileCommand command,
        CancellationToken cancellationToken)
    {
        var lawyerId = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(
            nameof(GetLawyerById),
            new { id = lawyerId },
            new { lawyerId });
    }
}