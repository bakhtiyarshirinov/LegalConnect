using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CreateMeeting;

public class CreateMeetingCommandHandler : IRequestHandler<CreateMeetingCommand, string>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDailyService _dailyService;
    private readonly IEmailService _emailService;

    public CreateMeetingCommandHandler(
        IUnitOfWork unitOfWork,
        IDailyService dailyService,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _dailyService = dailyService;
        _emailService = emailService;
    }

    public async Task<string> Handle(CreateMeetingCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _unitOfWork.Appointments.GetByIdAsync(request.AppointmentId)
            ?? throw new KeyNotFoundException($"Appointment {request.AppointmentId} not found");

        if (appointment.Status != AppointmentStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed appointments can have a meeting room");

        var hoursUntil = (appointment.ScheduledAt - DateTime.UtcNow).TotalHours;
        if (hoursUntil > 2 || hoursUntil < -appointment.DurationMinutes / 60.0)
            throw new InvalidOperationException("Meeting room can only be created within 2 hours of the appointment");

        if (!string.IsNullOrEmpty(appointment.MeetingUrl))
            return appointment.MeetingUrl;

        var meetingUrl = await _dailyService.CreateRoomAsync(appointment.Id);

        appointment.SetMeetingUrl(meetingUrl);
        _unitOfWork.Appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var lawyerName = appointment.Lawyer.User.FullName;
        var clientName = appointment.Client.FullName;

        await Task.WhenAll(
            _emailService.SendMeetingLinkAsync(
                appointment.Client.Email, clientName, lawyerName, meetingUrl, appointment.ScheduledAt),
            _emailService.SendMeetingLinkAsync(
                appointment.Lawyer.User.Email, lawyerName, clientName, meetingUrl, appointment.ScheduledAt)
        );

        return meetingUrl;
    }
}
