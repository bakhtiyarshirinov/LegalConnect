using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Repositories;

public class LawyerRepository : ILawyerRepository
{
    private readonly ApplicationDbContext _context;

    public LawyerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Lawyer?> GetByIdAsync(Guid id)
        => await _context.Lawyers
            .Include(l => l.User)
            .Include(l => l.Specializations)
            .ThenInclude(ls => ls.Specialization)
            .FirstOrDefaultAsync(l => l.Id == id);

    public async Task<Lawyer?> GetByUserIdAsync(Guid userId)
        => await _context.Lawyers
            .Include(l => l.Specializations)
            .FirstOrDefaultAsync(l => l.UserId == userId);

    public async Task<IEnumerable<Lawyer>> GetAllAsync(
        string? city,
        int? specializationId,
        decimal? maxRate,
        decimal? minRate = null,
        int? minExperience = null,
        float? minRating = null,
        string? sortBy = null)
    {
        var query = _context.Lawyers
            .Include(l => l.User)
            .Include(l => l.Specializations)
            .ThenInclude(ls => ls.Specialization)
            .Where(l => l.IsAvailable && l.IsVerified)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(city))
        {
            var normalizedCity = city.Trim().ToLower();
            query = query.Where(l => l.City.ToLower() == normalizedCity);
        }
        if (specializationId.HasValue)
            query = query.Where(l => l.Specializations.Any(s => s.SpecializationId == specializationId));
        if (maxRate.HasValue)
            query = query.Where(l => l.HourlyRate <= maxRate);
        if (minRate.HasValue)
            query = query.Where(l => l.HourlyRate >= minRate);
        if (minExperience.HasValue)
            query = query.Where(l => l.ExperienceYears >= minExperience);
        if (minRating.HasValue)
            query = query.Where(l => l.Rating >= minRating);

        query = sortBy switch
        {
            "price_asc"  => query.OrderBy(l => l.HourlyRate),
            "price_desc" => query.OrderByDescending(l => l.HourlyRate),
            "experience" => query.OrderByDescending(l => l.ExperienceYears),
            _            => query.OrderByDescending(l => l.Rating),
        };

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Lawyer>> GetPendingAsync()
        => await _context.Lawyers
            .Include(l => l.User)
            .Include(l => l.Specializations)
            .ThenInclude(ls => ls.Specialization)
            .Where(l => !l.IsVerified)
            .OrderBy(l => l.User.FullName)
            .ToListAsync();

    public async Task<IEnumerable<Lawyer>> GetVerifiedAsync()
        => await _context.Lawyers
            .Include(l => l.User)
            .Include(l => l.Specializations)
            .ThenInclude(ls => ls.Specialization)
            .Where(l => l.IsVerified)
            .OrderBy(l => l.User.FullName)
            .ToListAsync();

    public async Task AddAsync(Lawyer lawyer)
        => await _context.Lawyers.AddAsync(lawyer);

    public void Update(Lawyer lawyer)
        => _context.Lawyers.Update(lawyer);

    public void RemoveSpecialization(LawyerSpecialization spec)
        => _context.LawyerSpecializations.Remove(spec);

    public async Task AddSpecializationAsync(LawyerSpecialization spec)
        => await _context.LawyerSpecializations.AddAsync(spec);
}