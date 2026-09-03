using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetUserProfile;

/// <summary>
/// Admin-only: full profile of a single user by id. There is only one Admin role in
/// the system (no permission tiers — see UserRole enum), so this returns every field
/// the admin panel can display, without gradation.
/// </summary>
public record GetUserProfileQuery(Guid UserId) : IRequest<UserProfileDto>;
