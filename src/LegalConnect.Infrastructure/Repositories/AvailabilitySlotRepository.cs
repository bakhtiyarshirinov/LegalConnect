using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Repositories;

public class AvailabilitySlotRepository : IAvailabilitySlotRepository
{
    private readonly ApplicationDbContext _context;

    public AvailabilitySlotRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AvailabilitySlot>> GetByLawyerIdAsync(
        Guid lawyerId, DateTime from, DateTime to)
    {
        var fromUtc = DateTime.SpecifyKind(from, DateTimeKind.Utc);
        var toUtc = DateTime.SpecifyKind(to, DateTimeKind.Utc);
        return await _context.AvailabilitySlots
            .Where(s => s.LawyerId == lawyerId && s.StartTime >= fromUtc && s.StartTime < toUtc)
            .OrderBy(s => s.StartTime)
            .ToListAsync();
    }

    public async Task<AvailabilitySlot?> GetByIdAsync(Guid id)
        => await _context.AvailabilitySlots.FirstOrDefaultAsync(s => s.Id == id);

    public async Task<IEnumerable<AvailabilitySlot>> GetAvailableByLawyerIdAsync(
        Guid lawyerId, DateTime from)
    {
        var fromUtc = DateTime.SpecifyKind(from, DateTimeKind.Utc);
        var toUtc = fromUtc.AddDays(1);
        return await _context.AvailabilitySlots
            .Where(s => s.LawyerId == lawyerId &&
                        s.StartTime >= fromUtc &&
                        s.StartTime < toUtc &&
                        !s.IsBooked)
            .OrderBy(s => s.StartTime)
            .ToListAsync();
    }

    public async Task AddAsync(AvailabilitySlot slot)
        => await _context.AvailabilitySlots.AddAsync(slot);

    public async Task AddRangeAsync(IEnumerable<AvailabilitySlot> slots)
        => await _context.AvailabilitySlots.AddRangeAsync(slots);

    public void Update(AvailabilitySlot slot)
        => _context.AvailabilitySlots.Update(slot);

    public void Delete(AvailabilitySlot slot)
        => _context.AvailabilitySlots.Remove(slot);
}
