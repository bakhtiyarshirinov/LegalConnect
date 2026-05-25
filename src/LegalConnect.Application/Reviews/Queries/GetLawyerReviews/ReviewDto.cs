namespace LegalConnect.Application.Reviews.Queries.GetLawyerReviews;

public record ReviewDto(
    Guid Id,
    string ClientFullName,
    int Rating,
    string? Comment,
    DateTime CreatedAt
);