using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Slots;

/// <summary>
/// PATCH /api/slots/{id} — moves a free slot to a new time. Covers the exact defect that
/// broke drag-and-drop in Cədvəl: the old "create-at-new-time, then delete-the-old-one"
/// workaround rejected a valid backward move because the not-yet-deleted original slot's
/// StartTime fell inside the new range.
/// </summary>
public class MoveSlotTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public MoveSlotTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private sealed record SlotDto(Guid Id, DateTime StartTime, DateTime EndTime, bool IsBooked);
    private sealed record LawyerCreatedResponse(Guid LawyerId);

    private async Task<(Guid lawyerUserId, string lawyerEmail, Guid lawyerEntityId)> RegisterAndCreateLawyerAsync()
    {
        var lawyerEmail = $"moveslot_{Guid.NewGuid():N}@test.az";
        var reg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Move Slot Lawyer", email = lawyerEmail, password = "TestPass1", phone = (string?)null
        });
        var lawyerUserId = (await reg.Content.ReadFromJsonAsync<AuthResult>())!.UserId;

        _client.SetBearerToken(lawyerUserId, lawyerEmail, "Lawyer");
        var lawyerCreate = await _client.PostAsJsonAsync("/api/lawyers", new
        {
            userId = lawyerUserId, bio = "Move slot test lawyer", city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}", experienceYears = 5, hourlyRate = 100.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });
        var lawyerEntityId = (await lawyerCreate.Content.ReadFromJsonAsync<LawyerCreatedResponse>())!.LawyerId;

        _client.SetBearerToken(Guid.NewGuid(), $"admin_{Guid.NewGuid():N}@test.az", "Admin");
        await _client.PutAsync($"/api/admin/lawyers/{lawyerEntityId}/verify", null);

        _client.SetBearerToken(lawyerUserId, lawyerEmail, "Lawyer");
        return (lawyerUserId, lawyerEmail, lawyerEntityId);
    }

    private async Task<Guid> CreateSlotAsync(DateTime start, DateTime end)
    {
        var resp = await _client.PostAsJsonAsync("/api/slots", new { startTime = start, endTime = end });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadFromJsonAsync<Dictionary<string, Guid>>();
        return body!["slotId"];
    }

    [Fact]
    public async Task MoveSlot_FreeSlot_UpdatesTime()
    {
        var (_, _, lawyerEntityId) = await RegisterAndCreateLawyerAsync();
        var start = DateTime.UtcNow.AddDays(10).Date.AddHours(10);
        var slotId = await CreateSlotAsync(start, start.AddHours(1));

        var newStart = start.AddHours(3);
        var resp = await _client.PatchAsJsonAsync($"/api/slots/{slotId}",
            new { startTime = newStart, endTime = newStart.AddHours(1) });

        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var dateStr = start.Date.ToString("yyyy-MM-dd");
        var nextDay = start.Date.AddDays(1).ToString("yyyy-MM-dd");
        var slots = await _client.GetFromJsonAsync<List<SlotDto>>(
            $"/api/slots?lawyerId={lawyerEntityId}&from={dateStr}&to={nextDay}");

        slots.Should().ContainSingle(s => s.Id == slotId && s.StartTime == newStart && s.EndTime == newStart.AddHours(1));
    }

    [Fact]
    public async Task MoveSlot_BackwardWithinOwnDuration_Succeeds()
    {
        // Regression for the exact drag bug: moving a slot EARLIER by less than its own
        // duration used to fail under create-then-delete because the not-yet-deleted
        // original slot's StartTime landed inside the new range.
        var (_, _, lawyerEntityId) = await RegisterAndCreateLawyerAsync();
        var start = DateTime.UtcNow.AddDays(11).Date.AddHours(10); // 10:00, 60-minute slot
        var slotId = await CreateSlotAsync(start, start.AddHours(1));

        var newStart = start.AddMinutes(-30); // 09:30 — overlaps the slot's own original range
        var resp = await _client.PatchAsJsonAsync($"/api/slots/{slotId}",
            new { startTime = newStart, endTime = newStart.AddHours(1) });

        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var dateStr = newStart.Date.ToString("yyyy-MM-dd");
        var nextDay = newStart.Date.AddDays(1).ToString("yyyy-MM-dd");
        var slots = await _client.GetFromJsonAsync<List<SlotDto>>(
            $"/api/slots?lawyerId={lawyerEntityId}&from={dateStr}&to={nextDay}");

        slots.Should().ContainSingle(s => s.Id == slotId && s.StartTime == newStart);
    }

    [Fact]
    public async Task MoveSlot_BookedSlot_Returns400WithClearMessage()
    {
        var (lawyerUserId, lawyerEmail, lawyerEntityId) = await RegisterAndCreateLawyerAsync();
        var start = DateTime.UtcNow.AddDays(12).Date.AddHours(10);
        var slotId = await CreateSlotAsync(start, start.AddHours(1));

        // Book it: client creates an appointment against this slot.
        var clientEmail = $"moveslot_client_{Guid.NewGuid():N}@test.az";
        var clientReg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Move Slot Client", email = clientEmail, password = "TestPass1", phone = (string?)null
        });
        var clientUserId = (await clientReg.Content.ReadFromJsonAsync<AuthResult>())!.UserId;
        _client.SetBearerToken(clientUserId, clientEmail, "Client");
        var book = await _client.PostAsJsonAsync("/api/appointments", new
        {
            clientId = clientUserId, lawyerId = lawyerEntityId,
            scheduledAt = start, durationMinutes = 60, type = 1, slotId
        });
        book.StatusCode.Should().Be(HttpStatusCode.OK);

        _client.SetBearerToken(lawyerUserId, lawyerEmail, "Lawyer");

        var resp = await _client.PatchAsJsonAsync($"/api/slots/{slotId}",
            new { startTime = start.AddHours(3), endTime = start.AddHours(4) });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await resp.Content.ReadAsStringAsync();
        body.Should().Contain("booked");
    }

    [Fact]
    public async Task MoveSlot_OntoAnotherSlot_Returns409()
    {
        var (_, _, lawyerEntityId) = await RegisterAndCreateLawyerAsync();
        var start = DateTime.UtcNow.AddDays(13).Date.AddHours(9);
        var slotA = await CreateSlotAsync(start, start.AddHours(1));
        var slotB = await CreateSlotAsync(start.AddHours(2), start.AddHours(3));

        var resp = await _client.PatchAsJsonAsync($"/api/slots/{slotA}",
            new { startTime = start.AddHours(2), endTime = start.AddHours(3) });

        resp.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }
}
