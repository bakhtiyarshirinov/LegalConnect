using LegalConnect.Domain.Entities;

namespace LegalConnect.Domain.Interfaces.Repositories;

public interface ILawyerRepository
{
    Task<Lawyer?> GetByIdAsync(Guid id);
    Task<Lawyer?> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<Lawyer>> GetAllAsync(string? city, int? specializationId, decimal? maxRate, decimal? minRate = null, int? minExperience = null, float? minRating = null, string? sortBy = null);
    Task<IEnumerable<Lawyer>> GetPendingAsync();
    Task<IEnumerable<Lawyer>> GetVerifiedAsync();
    Task AddAsync(Lawyer lawyer);
    void Update(Lawyer lawyer);
    void RemoveSpecialization(LawyerSpecialization spec);
    Task AddSpecializationAsync(LawyerSpecialization spec);
}