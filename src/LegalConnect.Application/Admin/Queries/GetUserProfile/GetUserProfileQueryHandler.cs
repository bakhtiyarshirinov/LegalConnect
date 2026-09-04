using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Admin.Queries.GetUserProfile;

public class GetUserProfileQueryHandler
    : IRequestHandler<GetUserProfileQuery, UserProfileDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUserProfileQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserProfileDto> Handle(
        GetUserProfileQuery request,
        CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(request.UserId)
            ?? throw new KeyNotFoundException($"User with id {request.UserId} not found");

        LawyerProfileInfo? lawyerInfo = null;
        IEnumerable<Appointment> appointments;

        if (user.Role == UserRole.Lawyer)
        {
            var stub = await _unitOfWork.Lawyers.GetByUserIdAsync(user.Id);
            // Re-fetch by lawyer id — that path also includes specialization names.
            var lawyer = stub is null ? null : await _unitOfWork.Lawyers.GetByIdAsync(stub.Id);

            if (lawyer is not null)
            {
                lawyerInfo = new LawyerProfileInfo(
                    LawyerId: lawyer.Id,
                    City: lawyer.City,
                    LicenseNumber: lawyer.LicenseNumber,
                    ExperienceYears: lawyer.ExperienceYears,
                    HourlyRate: lawyer.HourlyRate,
                    Rating: lawyer.Rating,
                    ReviewCount: lawyer.ReviewCount,
                    IsVerified: lawyer.IsVerified,
                    IsAvailable: lawyer.IsAvailable,
                    Specializations: lawyer.Specializations
                        .Select(s => s.Specialization.Name)
                        .ToList(),
                    CancellationReason: lawyer.CancellationReason,
                    CancelledAt: lawyer.CancelledAt,
                    RejectionReason: lawyer.RejectionReason,
                    RejectedAt: lawyer.RejectedAt);

                appointments = await _unitOfWork.Appointments.GetByLawyerIdAsync(lawyer.Id);
            }
            else
            {
                appointments = Array.Empty<Appointment>();
            }
        }
        else
        {
            appointments = await _unitOfWork.Appointments.GetByClientIdAsync(user.Id);
        }

        var list = appointments.ToList();
        var activity = new ActivitySummary(
            TotalAppointments: list.Count,
            PendingAppointments: list.Count(a => a.Status == AppointmentStatus.Pending),
            ConfirmedAppointments: list.Count(a => a.Status == AppointmentStatus.Confirmed),
            CompletedAppointments: list.Count(a => a.Status == AppointmentStatus.Completed),
            CancelledAppointments: list.Count(a => a.Status == AppointmentStatus.Cancelled));

        return new UserProfileDto(
            Id: user.Id,
            FullName: user.FullName,
            Email: user.Email,
            Phone: user.Phone,
            Role: user.Role.ToString(),
            IsVerified: user.IsVerified,
            CreatedAt: user.CreatedAt,
            LastSeen: user.LastSeen,
            AvatarUrl: user.AvatarUrl,
            Lawyer: lawyerInfo,
            Activity: activity);
    }
}
