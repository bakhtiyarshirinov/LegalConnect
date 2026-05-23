namespace LegalConnect.Domain.Entities;


public class LawyerSpecialization
{
    public Guid LawyerId { get; private set; }
    public int SpecializationId { get; private set; }

    public Lawyer Lawyer { get; private set; }
    public Specialization Specialization { get; private set; }

    private LawyerSpecialization() { }

    public static LawyerSpecialization Create(Guid lawyerId, int specializationId)
    {
        return new LawyerSpecialization
        {
            LawyerId = lawyerId,
            SpecializationId = specializationId
        };
    }
}