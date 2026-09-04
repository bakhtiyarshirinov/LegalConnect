using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetAllUsers;

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, IEnumerable<UserAdminDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllUsersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<UserAdminDto>> Handle(
        GetAllUsersQuery request,
        CancellationToken cancellationToken)
    {
        var users = await _unitOfWork.Users.GetAllAsync();

        // Single source of truth for a lawyer's status = the Lawyer entity
        // (the same flags the Vəkillər page reads).
        var lawyerByUserId = (await _unitOfWork.Lawyers.GetAllAsync())
            .ToDictionary(l => l.UserId);

        return users.Select(u =>
        {
            var isLawyer = u.Role == UserRole.Lawyer;
            lawyerByUserId.TryGetValue(u.Id, out var lawyer);

            // Lawyer  → admin-approval flag from the Lawyer entity.
            // Client/Admin → the user's e-mail confirmation (User.IsVerified).
            // User.IsVerified stays e-mail-only (JWT email_verified claim / OTP gate) and
            // is never synced to admin approval — the two are different concepts.
            var isVerified = isLawyer ? lawyer?.IsVerified ?? false : u.IsVerified;

            var lawyerStatus = !isLawyer ? null
                : lawyer is null ? "Pending"
                : lawyer.IsVerified ? "Verified"
                : lawyer.RejectedAt is not null ? "Rejected"
                : "Pending";

            return new UserAdminDto(
                u.Id, u.FullName, u.Email, u.Role.ToString(),
                isVerified, u.CreatedAt, lawyerStatus);
        });
    }
}
