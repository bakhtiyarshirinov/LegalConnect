using LegalConnect.Application.Common.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace LegalConnect.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;
    private readonly string _fromName;
    private readonly string _fromEmail;

    public EmailService(IConfiguration configuration)
    {
        var s = configuration.GetSection("EmailSettings");
        _host      = s["Host"]      ?? "smtp.gmail.com";
        _port      = int.Parse(s["Port"] ?? "587");
        _username  = s["Username"]  ?? throw new InvalidOperationException("EmailSettings:Username not configured");
        _password  = s["Password"]  ?? throw new InvalidOperationException("EmailSettings:Password not configured");
        _fromName  = s["FromName"]  ?? "LegalConnect";
        _fromEmail = s["FromEmail"] ?? _username;
    }

    public async Task SendOtpAsync(string email, string fullName, string otp)
    {
        var html = $"""
            <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #E8E8E8;">
              <div style="margin-bottom:24px;">
                <span style="font-size:20px;font-weight:700;color:#0A0A0A;letter-spacing:-0.3px;">LegalConnect</span>
              </div>
              <h2 style="font-size:22px;font-weight:700;color:#0A0A0A;margin:0 0 8px;">Your verification code</h2>
              <p style="color:#6B6B6B;font-size:15px;margin:0 0 24px;">Hi <strong style="color:#0A0A0A;">{fullName}</strong>, use the code below to complete your registration.</p>
              <div style="text-align:center;margin:24px 0;">
                <span style="display:inline-block;font-size:40px;font-weight:800;letter-spacing:10px;color:#0A0A0A;background:#F5F5F5;padding:16px 32px;border-radius:12px;border:1px solid #E8E8E8;">{otp}</span>
              </div>
              <p style="color:#A3A3A3;font-size:13px;margin:24px 0 0;">This code expires in <strong>5 minutes</strong>. If you didn't request this, ignore this email.</p>
            </div>
            """;

        await SendAsync(email, "Your LegalConnect verification code", html);
    }

    public async Task SendNewMessageNotificationAsync(
        string email,
        string fullName,
        string senderName,
        string messagePreview)
    {
        var preview = messagePreview.Length > 120
            ? messagePreview[..120] + "…"
            : messagePreview;

        var html = $"""
            <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #E8E8E8;">
              <div style="margin-bottom:24px;">
                <span style="font-size:20px;font-weight:700;color:#0A0A0A;letter-spacing:-0.3px;">LegalConnect</span>
              </div>
              <h2 style="font-size:22px;font-weight:700;color:#0A0A0A;margin:0 0 8px;">New message</h2>
              <p style="color:#6B6B6B;font-size:15px;margin:0 0 16px;">Hi <strong style="color:#0A0A0A;">{fullName}</strong>, you have a new message from <strong style="color:#0A0A0A;">{senderName}</strong>.</p>
              <div style="background:#F5F5F5;border-left:3px solid #0A0A0A;padding:14px 16px;border-radius:6px;margin:16px 0;">
                <p style="color:#333;font-size:14px;margin:0;line-height:1.5;">{System.Net.WebUtility.HtmlEncode(preview)}</p>
              </div>
              <p style="color:#A3A3A3;font-size:13px;margin:20px 0 0;">Log in to LegalConnect to reply.</p>
            </div>
            """;

        await SendAsync(email, $"New message from {senderName}", html);
    }

    public async Task SendPasswordResetAsync(string email, string fullName, string code)
    {
        var html = $"""
            <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #E8E8E8;">
              <div style="margin-bottom:24px;">
                <span style="font-size:20px;font-weight:700;color:#0A0A0A;letter-spacing:-0.3px;">LegalConnect</span>
              </div>
              <h2 style="font-size:22px;font-weight:700;color:#0A0A0A;margin:0 0 8px;">Password Reset Code</h2>
              <p style="color:#6B6B6B;font-size:15px;margin:0 0 24px;">Hi <strong style="color:#0A0A0A;">{fullName}</strong>, use the code below to reset your password.</p>
              <div style="text-align:center;margin:24px 0;">
                <span style="display:inline-block;font-size:40px;font-weight:800;letter-spacing:10px;color:#0A0A0A;background:#F5F5F5;padding:16px 32px;border-radius:12px;border:1px solid #E8E8E8;">{code}</span>
              </div>
              <p style="color:#A3A3A3;font-size:13px;margin:24px 0 0;">This code expires in <strong>5 minutes</strong>. If you didn't request a password reset, ignore this email.</p>
            </div>
            """;

        await SendAsync(email, "Reset your LegalConnect password", html);
    }

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_fromName, _fromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_username, _password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
