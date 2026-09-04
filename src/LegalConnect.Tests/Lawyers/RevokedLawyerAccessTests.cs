using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Lawyers;

/// <summary>
/// After an admin revokes a lawyer's verification the lawyer keeps READ access to the
/// portal but every state-changing lawyer action is refused with 403 +
/// code "lawyer_verification_revoked". A still-verified lawyer is unaffected.
/// </summary>
public class RevokedLawyerAccessTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RevokedLawyerAccessTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private sealed record LawyerRow(Guid Id, Guid UserId, string FullName, string Email);
    private sealed record MyProfile(Guid Id, Guid UserId, string FullName, bool IsVerified);

    private async Task<(Guid userId, string email)> RegisterLawyerAsync()
    {
        var email = $"lawyer_{Guid.NewGuid():N}@test.az";
        var resp = await _client.PostAsJsonAsync("/api/auth/register/lawyer", new
        {
            fullName = "Revoke Lawyer",
            email,
            password = "TestPass1",
            phone = (string?)null,
            bio = "Revoke access test lawyer",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 6,
            hourlyRate = 120.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });
        resp.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
        var auth = await resp.Content.ReadFromJsonAsync<AuthResult>();
        return (auth!.UserId, email);
    }

    private async Task<Guid> VerifyAsAdminAsync(string lawyerEmail)
    {
        _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");
        var pending = (await _client.GetFromJsonAsync<List<LawyerRow>>("/api/admin/lawyers/pending"))!;
        var id = pending.Single(l => l.Email == lawyerEmail).Id;
        (await _client.PutAsync($"/api/admin/lawyers/{id}/verify", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
        return id;
    }

    private static HttpContent SlotBody() => JsonContent.Create(new
    {
        startTime = DateTime.UtcNow.AddDays(7).Date.AddHours(10),
        endTime = DateTime.UtcNow.AddDays(7).Date.AddHours(11),
    });

    [Fact]
    public async Task RevokedLawyer_HasReadOnlyAccess()
    {
        var (userId, email) = await RegisterLawyerAsync();
        var lawyerId = await VerifyAsAdminAsync(email);

        // Revoke.
        (await _client.PutAsJsonAsync($"/api/admin/lawyers/{lawyerId}/cancel-verification",
            new { reason = "Documents failed a periodic re-check" }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Act as the revoked lawyer.
        _client.SetBearerToken(userId, email, "Lawyer");

        // Login still works.
        (await _client.PostAsJsonAsync("/api/auth/login", new { email, password = "TestPass1" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        // Reads still work, and expose the revoked state.
        var me = await _client.GetFromJsonAsync<MyProfile>("/api/lawyers/me");
        me!.IsVerified.Should().BeFalse();
        (await _client.GetAsync("/api/appointments/lawyer")).StatusCode.Should().Be(HttpStatusCode.OK);

        // Writes are blocked with the distinct code.
        var slotResp = await _client.PostAsync("/api/slots", SlotBody());
        slotResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await slotResp.Content.ReadAsStringAsync()).Should().Contain("lawyer_verification_revoked");

        var profileResp = await _client.PutAsJsonAsync("/api/lawyers/me", new
        {
            bio = "trying to edit", city = "Ganja", hourlyRate = 99m, experienceYears = 7, isAvailable = true
        });
        profileResp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task VerifiedLawyer_CanStillWrite()
    {
        var (userId, email) = await RegisterLawyerAsync();
        await VerifyAsAdminAsync(email);

        _client.SetBearerToken(userId, email, "Lawyer");

        var slotResp = await _client.PostAsync("/api/slots", SlotBody());
        slotResp.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
