using MediatR;

namespace LegalConnect.Application.Appointments.Commands.CreateMeeting;

public record CreateMeetingCommand(Guid AppointmentId) : IRequest<string>;
