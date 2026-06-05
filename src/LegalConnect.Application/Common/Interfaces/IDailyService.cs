namespace LegalConnect.Application.Common.Interfaces;

public interface IDailyService
{
    Task<string> CreateRoomAsync(Guid appointmentId);
    Task DeleteRoomAsync(string roomName);
}
