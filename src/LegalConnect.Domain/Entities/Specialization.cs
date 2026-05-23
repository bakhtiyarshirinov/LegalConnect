namespace LegalConnect.Domain.Entities;

public class Specialization
{
    public int Id { get; private set; }
    public string Name { get; private set; }
    public string? Description { get; private set; }

    public ICollection<LawyerSpecialization> LawyerSpecializations { get; private set; } = new List<LawyerSpecialization>();

    private Specialization() { }

    public static Specialization Create(string name, string? description = null)
    {
        return new Specialization
        {
            Name = name,
            Description = description
        };
    }
}