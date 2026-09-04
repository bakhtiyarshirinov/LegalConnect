using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Admin;

/// <summary>
/// Regression: lawyer verification status must be identical across
/// GET /api/admin/lawyers/{verified|pending} and GET /api/admin/users.
/// </summary>
public class LawyerVerificationConsistencyTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public LawyerVerificationConsistencyTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private sealed record LawyerRow(Guid Id, Guid UserId, string FullName, string Email);
    private sealed record UserRow(Guid Id, string FullName, string Email, string Role, bool IsVerified, DateTime CreatedAt);

    private void AsAdmin() =>
        _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");

    private async Task<(Guid lawyerEntityId, string email)> CreateUnverifiedLawyerAsync()
    {
        // Register through the lawyer flow so User.Role == Lawyer (mirrors real accounts
        // like farid@test.az / sebine@test.az). Creates User + LawyerProfile, IsVerified = false.
        var email = $"lawyer_{Guid.NewGuid():N}@test.az";
        var reg = await _client.PostAsJsonAsync("/api/auth/register/lawyer", new
        {
            fullName = "Consistency Lawyer",
            email,
            password = "TestPass1",
            phone = (string?)null,
            bio = "Consistency check lawyer profile",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 4,
            hourlyRate = 90.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });
        reg.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
        await reg.Content.ReadFromJsonAsync<AuthResult>();

        // Resolve the lawyer entity id from the admin pending list.
        _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");
        var pending = (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/pending"))!;
        var lawyerEntityId = pending.Single(l => l.Email.Equals(email, StringComparison.OrdinalIgnoreCase)).Id;
        return (lawyerEntityId, email);
    }

    private async Task<bool> InVerifiedListAsync(string email) =>
        (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/verified"))!
            .Any(l => l.Email.Equals(email, StringComparison.OrdinalIgnoreCase));

    private async Task<bool> InPendingListAsync(string email) =>
        (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/pending"))!
            .Any(l => l.Email.Equals(email, StringComparison.OrdinalIgnoreCase));

    private async Task<bool> UsersListVerifiedAsync(string email)
    {
        var row = (await _client.GetFromJsonAsync<List<UserRow>>("/api/admin/users"))!
            .Single(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return row.IsVerified;
    }

    [Fact]
    public async Task Approve_Then_Revoke_KeepsBothAdminEndpointsInSync()
    {
        var (lawyerId, email) = await CreateUnverifiedLawyerAsync();
        AsAdmin();

        // ── Initial: unverified everywhere ──────────────────────────────
        (await InPendingListAsync(email)).Should().BeTrue();
        (await InVerifiedListAsync(email)).Should().BeFalse();
        (await UsersListVerifiedAsync(email)).Should().BeFalse();

        // ── Approve ────────────────────────────────────────────────────
        (await _client.PutAsync($"/api/admin/lawyers/{lawyerId}/verify", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await InVerifiedListAsync(email)).Should().BeTrue();
        (await InPendingListAsync(email)).Should().BeFalse();
        (await UsersListVerifiedAsync(email)).Should().BeTrue("İstifadəçilər must agree with Vəkillər after approval");

        // ── Revoke ─────────────────────────────────────────────────────
        (await _client.PutAsJsonAsync($"/api/admin/lawyers/{lawyerId}/cancel-verification",
            new { reason = "License documents require re-check" }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await InPendingListAsync(email)).Should().BeTrue();
        (await InVerifiedListAsync(email)).Should().BeFalse();
        (await UsersListVerifiedAsync(email)).Should().BeFalse("İstifadəçilər must agree with Vəkillər after revoke");
    }
}
