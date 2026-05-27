using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
        => await _context.Users.FindAsync(id);

    public async Task<User?> GetByEmailAsync(string email)
        => await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim());

    public async Task<bool> ExistsByEmailAsync(string email)
        => await _context.Users
            .AnyAsync(u => u.Email == email.ToLower().Trim());

    public async Task AddAsync(User user)
        => await _context.Users.AddAsync(user);

    public async Task<IEnumerable<User>> GetAllAsync()
        => await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

    public void Update(User user)
        => _context.Users.Update(user);
}