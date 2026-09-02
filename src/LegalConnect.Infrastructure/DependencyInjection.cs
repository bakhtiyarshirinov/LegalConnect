using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using LegalConnect.Infrastructure.Persistence;
using LegalConnect.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LegalConnect.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddHttpClient("Daily");
        services.AddScoped<IDailyService, DailyService>();

        // Idempotency: in-memory store for one instance; swap for Redis/DB when scaling out.
        services.AddMemoryCache();
        services.AddSingleton<IIdempotencyStore, InMemoryIdempotencyStore>();

        return services;
    }
}
