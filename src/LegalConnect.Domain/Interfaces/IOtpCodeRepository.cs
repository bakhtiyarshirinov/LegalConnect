using LegalConnect.Domain.Entities;

namespace LegalConnect.Domain.Interfaces.Repositories;

public interface IOtpCodeRepository
{
    Task AddAsync(OtpCode otpCode);
    Task<OtpCode?> GetActiveByEmailAndCodeAsync(string email, string code);
    Task<OtpCode?> GetLatestActiveByEmailAsync(string email);
}
