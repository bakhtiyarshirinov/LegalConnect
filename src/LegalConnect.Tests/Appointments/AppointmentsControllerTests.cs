using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Appointments;

public class AppointmentsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AppointmentsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<(Guid clientUserId, Guid lawyerEntityId)> SetupClientAndLawyerAsync()
    {
        var clientEmail = $"client_{Guid.NewGuid():N}@test.az";
        var clientReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Appointment Client",
            email = clientEmail,
            password = "TestPass1",
            phone = (string?)null
        });
        var clientAuth = await clientReg.Content.ReadFromJsonAsync<AuthResult>();
        var clientUserId = clientAuth!.UserId;

        var lawyerEmail = $"lawyer_{Guid.NewGuid():N}@test.az";
        var lawyerReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Appointment Lawyer",
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
            bio = "Lawyer for appointments",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 5,
            hourlyRate = 100.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });

        var lawyerResult = await lawyerCreate.Content.ReadFromJsonAsync<LawyerCreatedResponse>();

        _client.SetBearerToken(clientUserId, clientEmail, "Client");

        return (clientUserId, lawyerResult!.LawyerId);
    }

    private async Task<Guid> CreateAppointmentAsync(Guid clientUserId, Guid lawyerEntityId)
    {
        var response = await _client.PostAsJsonAsync("/api/appointments", new
        {
            clientId = clientUserId,
            lawyerId = lawyerEntityId,
            scheduledAt = DateTime.UtcNow.AddDays(3),
            durationMinutes = 60,
            type = 1,
            notes = "Test appointment"
        });

        var result = await response.Content.ReadFromJsonAsync<AppointmentCreatedResponse>();
        return result!.AppointmentId;
    }

    [Fact]
    public async Task CreateAppointment_ValidData_Returns200()
    {
        var (clientUserId, lawyerEntityId) = await SetupClientAndLawyerAsync();

        var response = await _client.PostAsJsonAsync("/api/appointments", new
        {
            clientId = clientUserId,
            lawyerId = lawyerEntityId,
            scheduledAt = DateTime.UtcNow.AddDays(3),
            durationMinutes = 60,
            type = 1,
            notes = "Test"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AppointmentCreatedResponse>();
        result!.AppointmentId.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CreateAppointment_Unauthorized_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.PostAsJsonAsync("/api/appointments", new
        {
            clientId = Guid.NewGuid(),
            lawyerId = Guid.NewGuid(),
            scheduledAt = DateTime.UtcNow.AddDays(3),
            durationMinutes = 60,
            type = 1,
            notes = "Unauthorized"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetClientAppointments_ReturnsUserAppointments()
    {
        var (clientUserId, lawyerEntityId) = await SetupClientAndLawyerAsync();
        await CreateAppointmentAsync(clientUserId, lawyerEntityId);

        var response = await _client.GetAsync($"/api/appointments/client/{clientUserId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ConfirmAppointment_ByLawyer_Returns204()
    {
        var (clientUserId, lawyerEntityId) = await SetupClientAndLawyerAsync();
        var appointmentId = await CreateAppointmentAsync(clientUserId, lawyerEntityId);

        var response = await _client.PutAsync($"/api/appointments/{appointmentId}/confirm?lawyerId={lawyerEntityId}", null);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task ConfirmAppointment_ByWrongUser_Returns409()
    {
        var (clientUserId, lawyerEntityId) = await SetupClientAndLawyerAsync();
        var appointmentId = await CreateAppointmentAsync(clientUserId, lawyerEntityId);

        var wrongLawyerId = Guid.NewGuid();
        var response = await _client.PutAsync($"/api/appointments/{appointmentId}/confirm?lawyerId={wrongLawyerId}", null);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CancelAppointment_ByClient_Returns204()
    {
        var (clientUserId, lawyerEntityId) = await SetupClientAndLawyerAsync();
        var appointmentId = await CreateAppointmentAsync(clientUserId, lawyerEntityId);

        var response = await _client.PutAsync($"/api/appointments/{appointmentId}/cancel?userId={clientUserId}", null);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CancelAppointment_ByWrongUser_Returns409()
    {
        var (clientUserId, lawyerEntityId) = await SetupClientAndLawyerAsync();
        var appointmentId = await CreateAppointmentAsync(clientUserId, lawyerEntityId);

        var wrongUserId = Guid.NewGuid();
        var response = await _client.PutAsync($"/api/appointments/{appointmentId}/cancel?userId={wrongUserId}", null);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    private record AppointmentCreatedResponse(Guid AppointmentId);
    private record LawyerCreatedResponse(Guid LawyerId);
}
