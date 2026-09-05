using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Appointments;

/// <summary>
/// Propose/respond reschedule cycle, and the one-sided cancel-with-notification flow.
/// </summary>
public class RescheduleTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RescheduleTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private sealed record Setup(
        Guid ClientUserId, string ClientEmail,
        Guid LawyerUserId, string LawyerEmail,
        Guid LawyerEntityId);

    private sealed record AppointmentRow(
        Guid Id, DateTime ScheduledAt, string Status, string RescheduleStatus,
        DateTime? ProposedScheduledAt, Guid? ProposedByUserId, string? RescheduleReason);

    private sealed record NotificationRow(Guid Id, string Title, string Body, string Type, bool IsRead, DateTime CreatedAt);

    private void AsClient(Setup s) => _client.SetBearerToken(s.ClientUserId, s.ClientEmail, "Client");
    private void AsLawyer(Setup s) => _client.SetBearerToken(s.LawyerUserId, s.LawyerEmail, "Lawyer");

    private async Task<Setup> SetupVerifiedLawyerAndClientAsync()
    {
        var clientEmail = $"rsclient_{Guid.NewGuid():N}@test.az";
        var clientReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Reschedule Client", email = clientEmail, password = "TestPass1", phone = (string?)null
        });
        var clientUserId = (await clientReg.Content.ReadFromJsonAsync<AuthResult>())!.UserId;

        var lawyerEmail = $"rslawyer_{Guid.NewGuid():N}@test.az";
        var lawyerReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Reschedule Lawyer", email = lawyerEmail, password = "TestPass1", phone = (string?)null
        });
        var lawyerUserId = (await lawyerReg.Content.ReadFromJsonAsync<AuthResult>())!.UserId;

        _client.SetBearerToken(lawyerUserId, lawyerEmail, "Lawyer");
        var lawyerCreate = await _client.PostAsJsonAsync("/api/lawyers", new
        {
            userId = lawyerUserId,
            bio = "Lawyer for reschedule tests",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 5,
            hourlyRate = 100.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });
        var lawyerEntityId = (await lawyerCreate.Content.ReadFromJsonAsync<LawyerCreatedResponse>())!.LawyerId;

        _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");
        (await _client.PutAsync($"/api/admin/lawyers/{lawyerEntityId}/verify", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

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
            notes = "Reschedule test appointment"
        });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AppointmentCreatedResponse>();
        return result!.AppointmentId;
    }

    private async Task<AppointmentRow> GetAsClientAsync(Setup s, Guid appointmentId)
    {
        AsClient(s);
        var rows = await _client.GetFromJsonAsync<List<AppointmentRow>>("/api/appointments/client");
        return rows!.Single(r => r.Id == appointmentId);
    }

    private async Task<List<NotificationRow>> NotificationsForAsync(Guid userId, string bearerEmail, string role, Guid callerUserId)
    {
        _client.SetBearerToken(callerUserId, bearerEmail, role);
        return (await _client.GetFromJsonAsync<List<NotificationRow>>($"/api/notifications?userId={userId}"))!;
    }

    // ── (a) propose → accept ────────────────────────────────────────────────
    [Fact]
    public async Task ProposeReschedule_ThenAccept_UpdatesTimeAndNotifiesBoth()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var appointmentId = await CreateAppointmentAsync(s);
        var newTime = DateTime.UtcNow.AddDays(5);

        AsClient(s);
        var propose = await _client.PostAsJsonAsync(
            $"/api/appointments/{appointmentId}/propose-reschedule",
            new { newScheduledAt = newTime, reason = "Conflicts with another hearing" });
        propose.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Not moved yet, both sides still see the original time + a pending badge.
        var beforeAccept = await GetAsClientAsync(s, appointmentId);
        beforeAccept.RescheduleStatus.Should().Be("Pending");
        beforeAccept.ProposedByUserId.Should().Be(s.ClientUserId);

        AsLawyer(s);
        var respond = await _client.PostAsJsonAsync(
            $"/api/appointments/{appointmentId}/respond-reschedule",
            new { accept = true, reason = (string?)null });
        respond.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var after = await GetAsClientAsync(s, appointmentId);
        after.RescheduleStatus.Should().Be("None");
        after.ScheduledAt.Should().BeCloseTo(newTime, TimeSpan.FromSeconds(2));

        var clientNotifs = await NotificationsForAsync(s.ClientUserId, s.ClientEmail, "Client", s.ClientUserId);
        var lawyerNotifs = await NotificationsForAsync(s.LawyerUserId, s.LawyerEmail, "Lawyer", s.LawyerUserId);
        clientNotifs.Should().Contain(n => n.Type == "RescheduleAccepted");
        lawyerNotifs.Should().Contain(n => n.Type == "RescheduleAccepted");
    }

    // ── (b) propose → reject ────────────────────────────────────────────────
    [Fact]
    public async Task ProposeReschedule_ThenReject_TimeUnchangedAndInitiatorNotified()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var appointmentId = await CreateAppointmentAsync(s);
        var original = (await GetAsClientAsync(s, appointmentId)).ScheduledAt;
        var newTime = DateTime.UtcNow.AddDays(5);

        AsLawyer(s);
        (await _client.PostAsJsonAsync(
            $"/api/appointments/{appointmentId}/propose-reschedule",
            new { newScheduledAt = newTime, reason = (string?)null }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        AsClient(s);
        var respond = await _client.PostAsJsonAsync(
            $"/api/appointments/{appointmentId}/respond-reschedule",
            new { accept = false, reason = "That slot no longer works for me" });
        respond.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var after = await GetAsClientAsync(s, appointmentId);
        after.ScheduledAt.Should().BeCloseTo(original, TimeSpan.FromSeconds(2));
        after.RescheduleStatus.Should().Be("None");

        var lawyerNotifs = await NotificationsForAsync(s.LawyerUserId, s.LawyerEmail, "Lawyer", s.LawyerUserId);
        lawyerNotifs.Should().Contain(n => n.Type == "RescheduleRejected");
    }

    // ── (c) proposer cannot accept their own request ────────────────────────
    [Fact]
    public async Task Respond_ByProposerThemselves_Returns403()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var appointmentId = await CreateAppointmentAsync(s);

        AsClient(s);
        await _client.PostAsJsonAsync(
            $"/api/appointments/{appointmentId}/propose-reschedule",
            new { newScheduledAt = DateTime.UtcNow.AddDays(5), reason = (string?)null });

        var respond = await _client.PostAsJsonAsync(
            $"/api/appointments/{appointmentId}/respond-reschedule",
            new { accept = true, reason = (string?)null });

        respond.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── (d) cancel from either side notifies the other with the reason ─────
    [Fact]
    public async Task Cancel_ByClient_NotifiesLawyerWithReason()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var appointmentId = await CreateAppointmentAsync(s);

        AsClient(s);
        (await _client.PutAsJsonAsync($"/api/appointments/{appointmentId}/cancel",
            new { reason = "Client no longer needs the consultation" }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var lawyerNotifs = await NotificationsForAsync(s.LawyerUserId, s.LawyerEmail, "Lawyer", s.LawyerUserId);
        lawyerNotifs.Should().Contain(n =>
            n.Type == "AppointmentCancelled" && n.Body.Contains("Client no longer needs the consultation"));
    }

    [Fact]
    public async Task Cancel_ByLawyer_NotifiesClientWithReason()
    {
        var s = await SetupVerifiedLawyerAndClientAsync();
        var appointmentId = await CreateAppointmentAsync(s);

        AsLawyer(s);
        (await _client.PutAsJsonAsync($"/api/appointments/{appointmentId}/cancel",
            new { reason = "Lawyer unavailable due to a court hearing" }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var clientNotifs = await NotificationsForAsync(s.ClientUserId, s.ClientEmail, "Client", s.ClientUserId);
        clientNotifs.Should().Contain(n =>
            n.Type == "AppointmentCancelled" && n.Body.Contains("Lawyer unavailable due to a court hearing"));
    }

    private record AppointmentCreatedResponse(Guid AppointmentId);
    private record LawyerCreatedResponse(Guid LawyerId);
}
