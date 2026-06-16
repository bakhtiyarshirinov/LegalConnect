using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Entities;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace LegalConnect.Tests.Helpers;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    public const int TestSpecializationId = 1;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        builder.ConfigureTestServices(services =>
        {
            // Remove ALL DbContext registrations (Npgsql)
            var dbDescriptors = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>)
                         || d.ServiceType == typeof(ApplicationDbContext))
                .ToList();
            foreach (var d in dbDescriptors) services.Remove(d);

            // Create isolated EF service provider with only InMemory
            var efSp = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            // Fixed DB name so all requests in the same factory share the same DB
            var dbName = "TestDb_" + Guid.NewGuid();
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(dbName);
                options.UseInternalServiceProvider(efSp);
            });

            services.RemoveAll<IEmailService>();
            services.AddSingleton<IEmailService, FakeEmailService>();

            services.RemoveAll<IDailyService>();
            services.AddSingleton<IDailyService, FakeDailyService>();
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Seed one specialization so lawyer-creation tests work
        var spec = Specialization.Create("Civil Law", "Civil law matters");
        db.Specializations.Add(spec);
        db.SaveChanges();

        return host;
    }
}

public class FakeEmailService : IEmailService
{
    public Task SendOtpAsync(string email, string fullName, string otp) => Task.CompletedTask;
    public Task SendPasswordResetAsync(string email, string fullName, string code) => Task.CompletedTask;
    public Task SendNewMessageNotificationAsync(string email, string fullName, string senderName, string messagePreview) => Task.CompletedTask;
    public Task SendMeetingLinkAsync(string email, string fullName, string otherPartyName, string meetingUrl, DateTime scheduledAt) => Task.CompletedTask;
}

public class FakeDailyService : IDailyService
{
    public Task<string> CreateRoomAsync(Guid appointmentId) => Task.FromResult("https://fake.daily.co/test-room");
    public Task DeleteRoomAsync(string roomName) => Task.CompletedTask;
}
