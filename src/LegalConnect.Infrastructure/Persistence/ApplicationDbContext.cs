using LegalConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LegalConnect.Infrastructure.Persistence;


public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // DbSet — это таблица в БД
    public DbSet<User> Users => Set<User>();
    public DbSet<Lawyer> Lawyers => Set<Lawyer>();
    public DbSet<Specialization> Specializations => Set<Specialization>();
    public DbSet<LawyerSpecialization> LawyerSpecializations => Set<LawyerSpecialization>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Chat> Chats => Set<Chat>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}