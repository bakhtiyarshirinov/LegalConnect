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

    private sealed record Setup(
        Guid ClientUserId, string ClientEmail,
        Guid LawyerUserId, string LawyerEmail,
        Guid LawyerEntityId);

    private async Task<Guid> RegisterAsync(string role)
    {
        var email = $"{role}_{Guid.NewGuid():N}@test.az";
        var reg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = $"Appointment {role}",
            email,
            password = "TestPass1",
            phone = (string?)null
        });
        var auth = await reg.Content.ReadFromJsonAsync<AuthResult>();
        return auth!.UserId;
    }

    private void AsClient(Setup s) => _client.SetBearerToken(s.ClientUserId, s.ClientEmail, "Client");
    private void AsLawyer(Setup s) => _client.SetBearerToken(s.LawyerUserId, s.LawyerEmail, "Lawyer");
    private void AsAdmin() => _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");

    private async Task<Setup> SetupVerifiedLawyerAndClientAsync()
    {
        var clientEmail = $"client_{Guid.NewGuid():N}@test.az";
        var clientReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Appointment Client", email = clientEmail, password = "TestPass1", phone = (string?)null
        });
        var clientUserId = (await clientReg.Content.ReadFromJsonAsync<AuthResult>())!.UserId;

        var lawyerEmail = $"lawyer_{Guid.NewGuid():N}@test.az";
        var lawyerReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Appointment Lawyer", email = lawyerEmail, password = "TestPass1", phone = (string?)null
        });
        var lawyerUserId = (await lawyerReg.Content.ReadFromJsonAsync<AuthResult>())!.UserId;

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
        var lawyerEntityId = (await lawyerCreate.Content.ReadFromJsonAsync<LawyerCreatedResponse>())!.LawyerId;

        // Verify the lawyer as admin — bookings are blocked for unverified lawyers.
        _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");
        var verify = await _client.PutAsync($"/api/admin/lawyers/{lawyerEntityId}/verify", null);
        verify.StatusCode.Should().Be(HttpStatusCode.NoContent);

        return new Setup(clientUserId, clientEmail, lawyerUserId, lawyerEmail, lawyerEntityId);
    }

    private async Task<Guid> CreateAppointmentAsync(Setup s)
    {
        AsClient(s);
        var response = await _client.PostAsJsonAsync("/api/appointments", new
        {
            clientId = s.ClientUserId,
            lawyerId = s.LawyerEntityId,
            scheduledAt = DateTime.UtcNow.AddDays(3),
            durationMinutes = 60,
            type = 1,
            notes = "Test appointment"
        });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AppointmentCreatedResponse>();
        return result!.AppointmentId;
    }

    // ─── cancel (4.2) — reason mandatory ────────────────────────────────────

    [Fact]
    public async Task Cancel_ByClient_WithReason_Returns204()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        AsClient(s);
        var response = await _client.PutAsJsonAsync($"/api/appointments/{id}/cancel",
            new { reason = "Client no longer needs the consultation" });

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Cancel_ByLawyer_WithReason_Returns204()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        AsLawyer(s);
        var response = await _client.PutAsJsonAsync($"/api/appointments/{id}/cancel",
            new { reason = "Lawyer unavailable due to a court hearing" });

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Cancel_ByAdmin_Returns204()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        AsAdmin();
        var response = await _client.PutAsJsonAsync($"/api/appointments/{id}/cancel",
            new { reason = "Cancelled by platform administration" });

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Cancel_WithoutReason_Returns400()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        AsClient(s);
        var response = await _client.PutAsJsonAsync($"/api/appointments/{id}/cancel",
            new { reason = (string?)null });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Cancel_ReasonTooShort_Returns400()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        AsClient(s);
        var response = await _client.PutAsJsonAsync($"/api/appointments/{id}/cancel",
            new { reason = "short" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Cancel_AlreadyCancelled_Returns409()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        AsClient(s);
        await _client.PutAsJsonAsync($"/api/appointments/{id}/cancel",
            new { reason = "First cancellation, valid reason" });

        var second = await _client.PutAsJsonAsync($"/api/appointments/{id}/cancel",
            new { reason = "Second attempt, should conflict" });

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Cancel_ByOutsider_Returns403()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        var outsiderId = await RegisterAsync("outsider");
        _client.SetBearerToken(outsiderId, $"outsider_{Guid.NewGuid():N}@test.az", "Client");

        var response = await _client.PutAsJsonAsync($"/api/appointments/{id}/cancel",
            new { reason = "I am not a participant of this appointment" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── delete (4.1) — reason optional ────────────────────────────────────

    [Fact]
    public async Task Delete_ByClient_WithoutReason_Returns204()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        AsClient(s);
        var response = await _client.DeleteAsync($"/api/appointments/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_ByClient_WithReason_Returns204()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        AsClient(s);
        var response = await _client.DeleteAsync(
            $"/api/appointments/{id}?reason=" + Uri.EscapeDataString("Booked by mistake"));

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_ByOutsider_Returns403()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var id = await CreateAppointmentAsync(s);

        var outsiderId = await RegisterAsync("outsider");
        _client.SetBearerToken(outsiderId, $"outsider_{Guid.NewGuid():N}@test.az", "Client");

        var response = await _client.DeleteAsync($"/api/appointments/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ─── unrelated regression guards ──────────────────────────────────────

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
    public async Task Cancel_Unauthorized_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.PutAsJsonAsync($"/api/appointments/{Guid.NewGuid()}/cancel",
            new { reason = "no token supplied on this request" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private record AppointmentCreatedResponse(Guid AppointmentId);
    private record LawyerCreatedResponse(Guid LawyerId);
}
