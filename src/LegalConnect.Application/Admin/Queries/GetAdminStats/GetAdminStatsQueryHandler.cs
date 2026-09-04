using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetAdminStats;

public class GetAdminStatsQueryHandler : IRequestHandler<GetAdminStatsQuery, AdminStatsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAdminStatsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<AdminStatsDto> Handle(
        GetAdminStatsQuery request,
        CancellationToken cancellationToken)
    {
        // Same sources the "İstifadəçilər" / "Vəkillər" pages read — kept in sync by design.
        var users = await _unitOfWork.Users.GetAllAsync();
        var verifiedLawyers = await _unitOfWork.Lawyers.GetVerifiedAsync();
        var pendingLawyers = await _unitOfWork.Lawyers.GetPendingAsync();

        return new AdminStatsDto(
            TotalUsers: users.Count(),
            VerifiedLawyers: verifiedLawyers.Count(),
            PendingApprovals: pendingLawyers.Count());
    }
}
