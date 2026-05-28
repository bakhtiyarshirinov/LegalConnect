using LegalConnect.Domain.Interfaces;
using LegalConnect.Domain.Interfaces.Repositories;
using LegalConnect.Infrastructure.Persistence;
using LegalConnect.Infrastructure.Repositories;

namespace LegalConnect.Infrastructure;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public IUserRepository Users { get; }
    public ILawyerRepository Lawyers { get; }
    public IAppointmentRepository Appointments { get; }
    public IChatRepository Chats { get; }
    public IReviewRepository Reviews { get; }
    public ISpecializationRepository Specializations { get; }
    public IOtpCodeRepository OtpCodes { get; }
    public INotificationRepository Notifications { get; }
    public IAvailabilitySlotRepository Slots { get; }

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Users = new UserRepository(context);
        Lawyers = new LawyerRepository(context);
        Appointments = new AppointmentRepository(context);
        Chats = new ChatRepository(context);
        Reviews = new ReviewRepository(context);
        Specializations = new SpecializationRepository(context);
        OtpCodes = new OtpCodeRepository(context);
        Notifications = new NotificationRepository(context);
        Slots = new AvailabilitySlotRepository(context);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);
}