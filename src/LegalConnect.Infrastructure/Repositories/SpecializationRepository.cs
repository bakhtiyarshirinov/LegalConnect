using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Repositories;

public class SpecializationRepository : ISpecializationRepository
{
    private readonly ApplicationDbContext _context;

    public SpecializationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Specialization>> GetAllAsync()
        => await _context.Specializations.ToListAsync();

    public async Task<Specialization?> GetByIdAsync(int id)
        => await _context.Specializations.FindAsync(id);

    public async Task<bool> ExistsAsync(int id)
        => await _context.Specializations.AnyAsync(s => s.Id == id);
}