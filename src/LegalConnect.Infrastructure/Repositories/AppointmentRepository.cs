using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly ApplicationDbContext _context;

    public AppointmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Appointment?> GetByIdAsync(Guid id)
        => await _context.Appointments
            .Include(a => a.Client)
            .Include(a => a.Lawyer)
            .FirstOrDefaultAsync(a => a.Id == id);

    public async Task<IEnumerable<Appointment>> GetByClientIdAsync(Guid clientId)
        => await _context.Appointments
            .Include(a => a.Lawyer).ThenInclude(l => l.User)
            .Where(a => a.ClientId == clientId)
            .OrderByDescending(a => a.ScheduledAt)
            .ToListAsync();

    public async Task<IEnumerable<Appointment>> GetByLawyerIdAsync(Guid lawyerId)
        => await _context.Appointments
            .Include(a => a.Client)
            .Where(a => a.LawyerId == lawyerId)
            .OrderByDescending(a => a.ScheduledAt)
            .ToListAsync();

    public async Task AddAsync(Appointment appointment)
        => await _context.Appointments.AddAsync(appointment);

    public void Update(Appointment appointment)
        => _context.Appointments.Update(appointment);

    public async Task<bool> HasConfirmedAsync(Guid clientId, Guid lawyerId)
        => await _context.Appointments.AnyAsync(a =>
            a.ClientId == clientId &&
            a.LawyerId == lawyerId &&
            a.Status == AppointmentStatus.Confirmed);
}