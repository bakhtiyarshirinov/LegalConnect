namespace LegalConnect.Application.Reviews.Queries.GetLawyerReviews;

public record ReviewDto(
    Guid Id,
    Guid AppointmentId,
    string ClientFullName,
    int Rating,
    string? Comment,
    DateTime CreatedAt
);
