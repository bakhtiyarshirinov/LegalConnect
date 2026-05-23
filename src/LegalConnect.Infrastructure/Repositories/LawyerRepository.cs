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
        decimal? maxRate)
    {
        var query = _context.Lawyers
            .Include(l => l.User)
            .Include(l => l.Specializations)
            .ThenInclude(ls => ls.Specialization)
            .Where(l => l.IsAvailable)
            .AsQueryable();

        if (!string.IsNullOrEmpty(city))
            query = query.Where(l => l.City == city);

        if (specializationId.HasValue)
            query = query.Where(l =>
                l.Specializations.Any(s => s.SpecializationId == specializationId));

        if (maxRate.HasValue)
            query = query.Where(l => l.HourlyRate <= maxRate);

        return await query
            .OrderByDescending(l => l.Rating)
            .ToListAsync();
    }

    public async Task AddAsync(Lawyer lawyer)
        => await _context.Lawyers.AddAsync(lawyer);

    public void Update(Lawyer lawyer)
        => _context.Lawyers.Update(lawyer);
}