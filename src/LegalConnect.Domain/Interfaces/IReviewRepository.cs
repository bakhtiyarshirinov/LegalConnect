using LegalConnect.Domain.Entities;

namespace LegalConnect.Domain.Interfaces.Repositories;

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(Guid id);
    Task<IEnumerable<Review>> GetByLawyerIdAsync(Guid lawyerId);
    Task<bool> ExistsByAppointmentIdAsync(Guid appointmentId);
    Task AddAsync(Review review);
}