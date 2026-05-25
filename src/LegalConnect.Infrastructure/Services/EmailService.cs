using LegalConnect.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Resend;

namespace LegalConnect.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly string _fromEmail;

    public EmailService(IResend resend, IConfiguration configuration)
    {
        _resend = resend;
        _fromEmail = configuration["ResendSettings:FromEmail"]
            ?? throw new InvalidOperationException("ResendSettings:FromEmail is not configured");
    }

    public async Task SendOtpAsync(string email, string fullName, string otp)
    {
        var message = new EmailMessage
        {
            From = _fromEmail,
            To = { email },
            Subject = "Ваш код подтверждения — LegalConnect",
            HtmlBody = $"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
                    <h2 style="color:#1a1a2e;margin-bottom:8px;">Подтверждение email</h2>
                    <p style="color:#555;font-size:15px;">Привет, <strong>{fullName}</strong>!</p>
                    <p style="color:#555;font-size:15px;">Используйте этот код для завершения регистрации:</p>
                    <div style="text-align:center;margin:24px 0;">
                        <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:8px;color:#2563eb;background:#e8f0fe;padding:16px 32px;border-radius:8px;">{otp}</span>
                    </div>
                    <p style="color:#888;font-size:13px;">Код действителен в течение <strong>5 минут</strong>.</p>
                    <p style="color:#888;font-size:13px;">Если вы не регистрировались в LegalConnect — просто проигнорируйте это письмо.</p>
                </div>
                """
        };

        await _resend.EmailSendAsync(message);
    }

    public async Task SendNewMessageNotificationAsync(
        string email,
        string fullName,
        string senderName,
        string messagePreview)
    {
        var preview = messagePreview.Length > 100
            ? messagePreview[..100] + "..."
            : messagePreview;

        var message = new EmailMessage
        {
            From = _fromEmail,
            To = { email },
            Subject = $"Новое сообщение от {senderName} — LegalConnect",
            HtmlBody = $"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
                    <h2 style="color:#1a1a2e;margin-bottom:8px;">У вас новое сообщение</h2>
                    <p style="color:#555;font-size:15px;">Привет, <strong>{fullName}</strong>!</p>
                    <p style="color:#555;font-size:15px;"><strong>{senderName}</strong> написал вам:</p>
                    <div style="background:#fff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:4px;margin:16px 0;">
                        <p style="color:#333;font-size:14px;margin:0;">{preview}</p>
                    </div>
                    <p style="color:#888;font-size:13px;">Войдите в LegalConnect, чтобы ответить.</p>
                </div>
                """
        };

        await _resend.EmailSendAsync(message);
    }
}
