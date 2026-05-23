using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly ApplicationDbContext _context;

    public ReviewRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Review?> GetByIdAsync(Guid id)
        => await _context.Reviews.FindAsync(id);

    public async Task<IEnumerable<Review>> GetByLawyerIdAsync(Guid lawyerId)
        => await _context.Reviews
            .Include(r => r.Client)
            .Where(r => r.LawyerId == lawyerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

    public async Task<bool> ExistsByAppointmentIdAsync(Guid appointmentId)
        => await _context.Reviews
            .AnyAsync(r => r.AppointmentId == appointmentId);

    public async Task AddAsync(Review review)
        => await _context.Reviews.AddAsync(review);
}