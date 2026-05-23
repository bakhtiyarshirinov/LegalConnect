namespace LegalConnect.Domain.Entities;

public class Review
{
    public Guid Id { get; private set; }
    public Guid ClientId { get; private set; }
    public Guid LawyerId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public int Rating { get; private set; }
    public string? Comment { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public User Client { get; private set; }
    public Lawyer Lawyer { get; private set; }
    public Appointment Appointment { get; private set; }

    private Review() { }

    public static Review Create(
        Guid clientId,
        Guid lawyerId,
        Guid appointmentId,
        int rating,
        string? comment = null)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5");

        return new Review
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            LawyerId = lawyerId,
            AppointmentId = appointmentId,
            Rating = rating,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };
    }
}