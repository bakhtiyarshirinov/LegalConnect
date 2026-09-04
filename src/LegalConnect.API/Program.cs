using System.Text;
using LegalConnect.API.Middleware;
using LegalConnect.API.Services;
using LegalConnect.Application;
using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Infrastructure;
using LegalConnect.SignalR.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ─── Caller identity (JWT-backed) ───────────────────────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// ─── JWT аутентификация ──────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!))
        };

        // SignalR не может передавать заголовок Authorization — берём токен из query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];

                if (!string.IsNullOrEmpty(accessToken) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

// ─── CORS ───────────────────────────────────────────────────────────────────

builder.Services.AddCors(options =>
{
    
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        
    });
});
// ─── SignalR ────────────────────────────────────────────────────────────────
builder.Services.AddSignalR(options =>
{
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

//app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseWebSockets();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// Reject authenticated-but-unverified users on all but the OTP/profile allow-list
app.UseMiddleware<EmailVerificationMiddleware>();

// Read-only lockout for a lawyer whose verification was revoked by an admin.
app.UseMiddleware<LawyerVerificationMiddleware>();

// Generic idempotency for POST/PUT requests that carry an Idempotency-Key header.
// After auth (needs the caller claim for key partitioning), just before MVC.
app.UseMiddleware<IdempotencyMiddleware>();

app.MapControllers();

// ─── SignalR Hub ─────────────────────────────────────────────────────────────
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

public partial class Program { }