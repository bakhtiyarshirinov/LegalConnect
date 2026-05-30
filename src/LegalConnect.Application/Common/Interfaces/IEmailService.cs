namespace LegalConnect.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendOtpAsync(string email, string fullName, string otp);
    Task SendNewMessageNotificationAsync(string email, string fullName, string senderName, string messagePreview);
    Task SendPasswordResetAsync(string email, string fullName, string code);
}
