using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Admin;

/// <summary>
/// Full reject cycle: pending application → PUT /api/admin/lawyers/{id}/reject with a
/// reason → no longer in the pending list, reflected as "Rejected" everywhere.
/// </summary>
public class RejectLawyerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RejectLawyerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private sealed record LawyerRow(Guid Id, Guid UserId, string FullName, string Email);
    private sealed record UserRow(
        Guid Id, string FullName, string Email, string Role, bool IsVerified,
        DateTime CreatedAt, string? LawyerStatus);

    private void AsAdmin() =>
        _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");

    private async Task<(Guid userId, string email)> RegisterLawyerAsync()
    {
        var email = $"lawyer_{Guid.NewGuid():N}@test.az";
        var resp = await _client.PostAsJsonAsync("/api/auth/register/lawyer", new
        {
            fullName = "Reject Lawyer",
            email,
            password = "TestPass1",
            phone = (string?)null,
            bio = "Reject cycle test lawyer",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 4,
            hourlyRate = 90.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });
        resp.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
        var auth = await resp.Content.ReadFromJsonAsync<AuthResult>();
        return (auth!.UserId, email);
    }

    private async Task<List<LawyerRow>> PendingAsync() =>
        (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/pending"))!;
    private async Task<List<LawyerRow>> VerifiedAsync() =>
        (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/verified"))!;
    private async Task<UserRow> UserRowAsync(string email) =>
        (await _client.GetFromJsonAsync<List<UserRow>>("/api/admin/users"))!
            .Single(u => u.Email == email);

    [Fact]
    public async Task Reject_PendingApplication_WithReason_RemovesFromPendingAndMarksRejected()
    {
        var (_, email) = await RegisterLawyerAsync();
        AsAdmin();

        var lawyerId = (await PendingAsync()).Single(l => l.Email == email).Id;
        (await UserRowAsync(email)).LawyerStatus.Should().Be("Pending");

        var resp = await _client.PutAsJsonAsync(
            $"/api/admin/lawyers/{lawyerId}/reject",
            new { reason = "License number could not be verified with the bar association" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await PendingAsync()).Should().NotContain(l => l.Email == email);
        (await VerifiedAsync()).Should().NotContain(l => l.Email == email);

        var row = await UserRowAsync(email);
        row.LawyerStatus.Should().Be("Rejected");
        row.IsVerified.Should().BeFalse();
    }

    [Fact]
    public async Task Reject_WithShortReason_Returns400()
    {
        var (_, email) = await RegisterLawyerAsync();
        AsAdmin();
        var lawyerId = (await PendingAsync()).Single(l => l.Email == email).Id;

        var resp = await _client.PutAsJsonAsync(
            $"/api/admin/lawyers/{lawyerId}/reject", new { reason = "short" });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Reject_AlreadyVerifiedLawyer_Returns400()
    {
        var (_, email) = await RegisterLawyerAsync();
        AsAdmin();
        var lawyerId = (await PendingAsync()).Single(l => l.Email == email).Id;
        (await _client.PutAsync($"/api/admin/lawyers/{lawyerId}/verify", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var resp = await _client.PutAsJsonAsync(
            $"/api/admin/lawyers/{lawyerId}/reject",
            new { reason = "Trying to reject an already verified lawyer" });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RejectedLawyer_CanBeReApprovedByAdmin_WhichClearsRejection()
    {
        var (_, email) = await RegisterLawyerAsync();
        AsAdmin();
        var lawyerId = (await PendingAsync()).Single(l => l.Email == email).Id;
        await _client.PutAsJsonAsync($"/api/admin/lawyers/{lawyerId}/reject",
            new { reason = "Documents incomplete on first review" });
        (await UserRowAsync(email)).LawyerStatus.Should().Be("Rejected");

        // Admin re-review — approving a rejected lawyer clears the rejection.
        (await _client.PutAsync($"/api/admin/lawyers/{lawyerId}/verify", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await VerifiedAsync()).Should().Contain(l => l.Email == email);
        var row = await UserRowAsync(email);
        row.LawyerStatus.Should().Be("Verified");
        row.IsVerified.Should().BeTrue();
    }
}
