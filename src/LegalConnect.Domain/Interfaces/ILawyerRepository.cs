using LegalConnect.Domain.Entities;

namespace LegalConnect.Domain.Interfaces.Repositories;

public interface ILawyerRepository
{
    Task<Lawyer?> GetByIdAsync(Guid id);
    Task<Lawyer?> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<Lawyer>> GetAllAsync(string? city, int? specializationId, decimal? maxRate);
    Task<IEnumerable<Lawyer>> GetPendingAsync();
    Task AddAsync(Lawyer lawyer);
    void Update(Lawyer lawyer);
    void RemoveSpecialization(LawyerSpecialization spec);
    Task AddSpecializationAsync(LawyerSpecialization spec);
}