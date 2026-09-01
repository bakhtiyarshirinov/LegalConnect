using LegalConnect.Application.Common.Exceptions;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LegalConnect.Application.Appointments.Commands.CreateMeeting;

public class CreateMeetingCommandHandler : IRequestHandler<CreateMeetingCommand, string>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDailyService _dailyService;
    private readonly IEmailService _emailService;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<CreateMeetingCommandHandler> _logger;

    public CreateMeetingCommandHandler(
        IUnitOfWork unitOfWork,
        IDailyService dailyService,
        IEmailService emailService,
        ICurrentUserService currentUser,
        ILogger<CreateMeetingCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _dailyService = dailyService;
        _emailService = emailService;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<string> Handle(CreateMeetingCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId)
            ?? throw new KeyNotFoundException($"Appointment {request.AppointmentId} not found");

        // Комнату может создать только участник записи (клиент или её юрист)
        var callerId = _currentUser.UserId;
        var isClient = appointment.ClientId == callerId;
        var isLawyer = appointment.Lawyer?.User is not null && appointment.Lawyer.UserId == callerId;
        if (!isClient && !isLawyer)
            throw new ForbiddenAccessException("You are not a participant of this appointment.");

        if (appointment.Status != AppointmentStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed appointments can have a meeting room");

        var hoursUntil = (appointment.ScheduledAt - DateTime.UtcNow).TotalHours;
        if (hoursUntil > 2 || hoursUntil < -appointment.DurationMinutes / 60.0)
            throw new BadRequestException("Meeting room can only be created within 2 hours of the appointment");

        if (!string.IsNullOrEmpty(appointment.MeetingUrl))
            return appointment.MeetingUrl;

        var meetingUrl = await _dailyService.CreateRoomAsync(appointment.Id);

        appointment.SetMeetingUrl(meetingUrl);
        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var lawyerName = appointment.Lawyer!.User.FullName;
        var clientName = appointment.Client.FullName;

        // Room is already persisted — an e-mail failure must not fail the request.
        try
        {
            await Task.WhenAll(
                _emailService.SendMeetingLinkAsync(
                    appointment.Client.Email, clientName, lawyerName, meetingUrl, appointment.ScheduledAt),
                _emailService.SendMeetingLinkAsync(
                    appointment.Lawyer.User.Email, lawyerName, clientName, meetingUrl, appointment.ScheduledAt)
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send meeting-link e-mails for appointment {AppointmentId}", appointment.Id);
        }

        return meetingUrl;
    }
}
