using LegalConnect.Domain.Entities;

namespace LegalConnect.Domain.Interfaces.Repositories;

public interface IAvailabilitySlotRepository
{
    Task<IEnumerable<AvailabilitySlot>> GetByLawyerIdAsync(Guid lawyerId, DateTime from, DateTime to);
    Task<AvailabilitySlot?> GetByIdAsync(Guid id);
    Task<IEnumerable<AvailabilitySlot>> GetAvailableByLawyerIdAsync(Guid lawyerId, DateTime from);
    Task AddAsync(AvailabilitySlot slot);
    Task AddRangeAsync(IEnumerable<AvailabilitySlot> slots);
    void Update(AvailabilitySlot slot);
    void Delete(AvailabilitySlot slot);
}
