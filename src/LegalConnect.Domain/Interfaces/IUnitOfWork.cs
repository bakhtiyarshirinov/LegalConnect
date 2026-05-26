using LegalConnect.Domain.Interfaces.Repositories;

namespace LegalConnect.Domain.Interfaces;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    ILawyerRepository Lawyers { get; }
    IAppointmentRepository Appointments { get; }
    IChatRepository Chats { get; }
    IReviewRepository Reviews { get; }
    ISpecializationRepository Specializations { get; }
    IOtpCodeRepository OtpCodes { get; }
    INotificationRepository Notifications { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}