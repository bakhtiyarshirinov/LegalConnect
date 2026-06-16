using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Slots;

public class SlotsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public SlotsControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<(Guid lawyerUserId, Guid lawyerEntityId)> RegisterAndCreateLawyerAsync()
    {
        var lawyerEmail = $"slotlawyer_{Guid.NewGuid():N}@test.az";
        var reg = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Slot Lawyer",
            email = lawyerEmail,
            password = "TestPass1",
            phone = (string?)null
        });
        var auth = await reg.Content.ReadFromJsonAsync<AuthResult>();
        var lawyerUserId = auth!.UserId;

        _client.SetBearerToken(lawyerUserId, lawyerEmail, "Lawyer");
        var lawyerCreate = await _client.PostAsJsonAsync("/api/lawyers", new
        {
            userId = lawyerUserId,
            bio = "Slot test lawyer",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 5,
            hourlyRate = 100.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });
        var lawyerResult = await lawyerCreate.Content.ReadFromJsonAsync<LawyerCreatedResponse>();

        return (lawyerUserId, lawyerResult!.LawyerId);
    }

    [Fact]
    public async Task CreateBulkSlots_ValidData_ReturnsCount()
    {
        var (_, lawyerEntityId) = await RegisterAndCreateLawyerAsync();

        var response = await _client.PostAsJsonAsync("/api/slots/bulk", new
        {
            lawyerId = lawyerEntityId,
            date = DateTime.UtcNow.AddDays(7),
            slotDurationMinutes = 60,
            startHour = 9,
            endHour = 17
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("count");
    }

    [Fact]
    public async Task GetAvailableSlots_ReturnsAvailableOnly()
    {
        var (_, lawyerEntityId) = await RegisterAndCreateLawyerAsync();

        var targetDate = DateTime.UtcNow.AddDays(8);

        await _client.PostAsJsonAsync("/api/slots/bulk", new
        {
            lawyerId = lawyerEntityId,
            date = targetDate,
            slotDurationMinutes = 60,
            startHour = 9,
            endHour = 17
        });

        var dateStr = targetDate.ToString("yyyy-MM-dd");
        var response = await _client.GetAsync($"/api/slots/available?lawyerId={lawyerEntityId}&date={dateStr}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task DeleteSlot_ValidSlot_Returns204()
    {
        var (_, lawyerEntityId) = await RegisterAndCreateLawyerAsync();

        var targetDate = DateTime.UtcNow.AddDays(9);
        var bulkResp = await _client.PostAsJsonAsync("/api/slots/bulk", new
        {
            lawyerId = lawyerEntityId,
            date = targetDate,
            slotDurationMinutes = 60,
            startHour = 10,
            endHour = 12
        });

        var dateStr = targetDate.ToString("yyyy-MM-dd");
        var nextDayStr = targetDate.AddDays(1).ToString("yyyy-MM-dd");
        var slotsResp = await _client.GetAsync($"/api/slots?lawyerId={lawyerEntityId}&from={dateStr}&to={nextDayStr}");
        var slots = await slotsResp.Content.ReadFromJsonAsync<List<SlotDto>>();
        slots.Should().NotBeNullOrEmpty();

        var slotId = slots!.First().Id;
        var deleteResp = await _client.DeleteAsync($"/api/slots/{slotId}?lawyerId={lawyerEntityId}");

        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    private record LawyerCreatedResponse(Guid LawyerId);
    private record SlotDto(Guid Id, DateTime StartTime, DateTime EndTime, bool IsBooked);
}
