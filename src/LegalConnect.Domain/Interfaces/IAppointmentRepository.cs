using LegalConnect.Domain.Entities;

namespace LegalConnect.Domain.Interfaces.Repositories;

public interface IAppointmentRepository
{
    Task<Appointment?> GetByIdAsync(Guid id);
    Task<IEnumerable<Appointment>> GetByClientIdAsync(Guid clientId);
    Task<IEnumerable<Appointment>> GetByLawyerIdAsync(Guid lawyerId);
    Task AddAsync(Appointment appointment);
    void Update(Appointment appointment);
    Task<bool> HasConfirmedAsync(Guid clientId, Guid lawyerId);
}