using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Repositories;

public class OtpCodeRepository : IOtpCodeRepository
{
    private readonly ApplicationDbContext _context;

    public OtpCodeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(OtpCode otpCode)
        => await _context.OtpCodes.AddAsync(otpCode);

    public async Task<OtpCode?> GetActiveByEmailAndCodeAsync(string email, string code)
        => await _context.OtpCodes
            .Where(o =>
                o.Email == email.ToLower().Trim() &&
                o.Code == code &&
                !o.IsUsed &&
                o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.ExpiresAt)
            .FirstOrDefaultAsync();

    public async Task<OtpCode?> GetLatestActiveByEmailAsync(string email)
        => await _context.OtpCodes
            .Where(o =>
                o.Email == email.ToLower().Trim() &&
                !o.IsUsed &&
                o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.ExpiresAt)
            .FirstOrDefaultAsync();

    public async Task InvalidateActiveCodesAsync(string email)
    {
        var normalized = email.ToLower().Trim();
        var active = await _context.OtpCodes
            .Where(o => o.Email == normalized && !o.IsUsed)
            .ToListAsync();

        foreach (var code in active)
            code.MarkAsUsed();
    }
}
