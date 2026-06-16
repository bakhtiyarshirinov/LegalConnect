using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Reviews;

public class ReviewsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ReviewsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<(Guid clientUserId, Guid lawyerEntityId, Guid appointmentId)> SetupCompletedAppointmentAsync()
    {
        var clientEmail = $"rclient_{Guid.NewGuid():N}@test.az";
        var clientReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Review Client",
            email = clientEmail,
            password = "TestPass1",
            phone = (string?)null
        });
        var clientAuth = await clientReg.Content.ReadFromJsonAsync<AuthResult>();
        var clientUserId = clientAuth!.UserId;

        var lawyerEmail = $"rlawyer_{Guid.NewGuid():N}@test.az";
        var lawyerReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Review Lawyer",
            email = lawyerEmail,
            password = "TestPass1",
            phone = (string?)null
        });
        var lawyerAuth = await lawyerReg.Content.ReadFromJsonAsync<AuthResult>();
        var lawyerUserId = lawyerAuth!.UserId;

        _client.SetBearerToken(lawyerUserId, lawyerEmail, "Lawyer");
        var lawyerCreate = await _client.PostAsJsonAsync("/api/lawyers", new
        {
            userId = lawyerUserId,
            bio = "Review lawyer bio",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 5,
            hourlyRate = 100.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });
        var lawyerResult = await lawyerCreate.Content.ReadFromJsonAsync<LawyerCreatedResponse>();
        var lawyerEntityId = lawyerResult!.LawyerId;

        _client.SetBearerToken(clientUserId, clientEmail, "Client");
        var apptResp = await _client.PostAsJsonAsync("/api/appointments", new
        {
            clientId = clientUserId,
            lawyerId = lawyerEntityId,
            scheduledAt = DateTime.UtcNow.AddDays(1),
            durationMinutes = 60,
            type = 1,
            notes = "Review test appointment"
        });
        var apptResult = await apptResp.Content.ReadFromJsonAsync<AppointmentCreatedResponse>();
        var appointmentId = apptResult!.AppointmentId;

        // Confirm then Complete
        await _client.PutAsync($"/api/appointments/{appointmentId}/confirm?lawyerId={lawyerEntityId}", null);
        await _client.PutAsync($"/api/appointments/{appointmentId}/complete?lawyerId={lawyerEntityId}", null);

        _client.SetBearerToken(clientUserId, clientEmail, "Client");

        return (clientUserId, lawyerEntityId, appointmentId);
    }

    [Fact]
    public async Task CreateReview_ValidData_Returns200()
    {
        var (clientUserId, lawyerEntityId, appointmentId) = await SetupCompletedAppointmentAsync();

        var response = await _client.PostAsJsonAsync("/api/reviews", new
        {
            clientId = clientUserId,
            lawyerId = lawyerEntityId,
            appointmentId,
            rating = 5,
            comment = "Excellent lawyer!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("reviewId");
    }

    [Fact]
    public async Task CreateReview_DuplicateReview_Returns409()
    {
        var (clientUserId, lawyerEntityId, appointmentId) = await SetupCompletedAppointmentAsync();

        var payload = new
        {
            clientId = clientUserId,
            lawyerId = lawyerEntityId,
            appointmentId,
            rating = 4,
            comment = "Good"
        };

        await _client.PostAsJsonAsync("/api/reviews", payload);
        var response = await _client.PostAsJsonAsync("/api/reviews", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetLawyerReviews_ReturnsReviews()
    {
        var (clientUserId, lawyerEntityId, appointmentId) = await SetupCompletedAppointmentAsync();

        await _client.PostAsJsonAsync("/api/reviews", new
        {
            clientId = clientUserId,
            lawyerId = lawyerEntityId,
            appointmentId,
            rating = 5,
            comment = "Great!"
        });

        var response = await _client.GetAsync($"/api/reviews/lawyer/{lawyerEntityId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotBeNullOrEmpty();
    }

    private record AppointmentCreatedResponse(Guid AppointmentId);
    private record LawyerCreatedResponse(Guid LawyerId);
}
