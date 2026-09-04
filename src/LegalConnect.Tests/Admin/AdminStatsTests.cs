using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Admin;

/// <summary>
/// GET /api/admin/stats must report real counts, matching the actual records
/// returned by /api/admin/users and /api/admin/lawyers/{verified,pending}.
/// (Regression: the dashboard cards used to show hardcoded 248 / 34.)
/// </summary>
public class AdminStatsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AdminStatsTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private sealed record StatsDto(int TotalUsers, int VerifiedLawyers, int PendingApprovals);
    private sealed record LawyerRow(Guid Id, Guid UserId, string FullName, string Email);
    private sealed record UserRow(Guid Id, string FullName, string Email, string Role, bool IsVerified, DateTime CreatedAt);

    private void AsAdmin() =>
        _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");

    private async Task RegisterClientAsync()
    {
        var email = $"client_{Guid.NewGuid():N}@test.az";
        var resp = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Stats Client", email, password = "TestPass1", phone = (string?)null
        });
        resp.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    private async Task<string> RegisterLawyerAsync()
    {
        var email = $"lawyer_{Guid.NewGuid():N}@test.az";
        var resp = await _client.PostAsJsonAsync("/api/auth/register/lawyer", new
        {
            fullName = "Stats Lawyer",
            email,
            password = "TestPass1",
            phone = (string?)null,
            bio = "Stats lawyer profile text",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 3,
            hourlyRate = 80.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });
        resp.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
        await resp.Content.ReadFromJsonAsync<AuthResult>();
        return email;
    }

    [Fact]
    public async Task Stats_MatchActualRecordCounts()
    {
        // 3 clients + 2 lawyers (one will be verified).
        await RegisterClientAsync();
        await RegisterClientAsync();
        await RegisterClientAsync();
        var lawyerToVerifyEmail = await RegisterLawyerAsync();
        await RegisterLawyerAsync();

        AsAdmin();

        var pendingBefore = (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/pending"))!;
        var lawyerId = pendingBefore.Single(l => l.Email == lawyerToVerifyEmail).Id;
        (await _client.PutAsync($"/api/admin/lawyers/{lawyerId}/verify", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Actual records via the real list endpoints.
        var users = (await _client.GetFromJsonAsync<List<UserRow>>("/api/admin/users"))!;
        var verified = (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/verified"))!;
        var pending = (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/pending"))!;

        var stats = (await _client.GetFromJsonAsync<StatsDto>("/api/admin/stats"))!;

        stats.TotalUsers.Should().Be(users.Count);
        stats.VerifiedLawyers.Should().Be(verified.Count);
        stats.PendingApprovals.Should().Be(pending.Count);

        // And the concrete numbers this test set up.
        stats.TotalUsers.Should().Be(5);
        stats.VerifiedLawyers.Should().Be(1);
        stats.PendingApprovals.Should().Be(1);
    }
}
