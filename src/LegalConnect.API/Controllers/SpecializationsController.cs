using LegalConnect.Application.Specializations.Queries.GetSpecializations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpecializationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SpecializationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>GET /api/specializations — public, no auth required.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetSpecializationsQuery(), cancellationToken);
        return Ok(result);
    }
}
