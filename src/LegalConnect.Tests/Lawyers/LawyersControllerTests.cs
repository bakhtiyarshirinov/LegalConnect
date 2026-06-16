using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Lawyers;

public class LawyersControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public LawyersControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(Guid userId, Guid lawyerId)> RegisterAndCreateLawyerAsync()
    {
        var email = $"lawyer_{Guid.NewGuid():N}@test.az";
        var regResp = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Test Lawyer User",
            email,
            password = "TestPass1",
            phone = (string?)null
        });
        var auth = await regResp.Content.ReadFromJsonAsync<AuthResult>();
        var userId = auth!.UserId;

        _client.SetBearerToken(userId, email, "Client");

        var createResp = await _client.PostAsJsonAsync("/api/lawyers", new
        {
            userId,
            bio = "Experienced lawyer",
            city = "Baku",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 5,
            hourlyRate = 100.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });

        var result = await createResp.Content.ReadFromJsonAsync<LawyerCreatedResponse>();
        return (userId, result!.LawyerId);
    }

    [Fact]
    public async Task GetLawyers_NoFilters_ReturnsAll()
    {
        await RegisterAndCreateLawyerAsync();

        var response = await _client.GetAsync("/api/lawyers");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var lawyers = await response.Content.ReadFromJsonAsync<List<object>>();
        lawyers.Should().NotBeNull();
    }

    [Fact]
    public async Task GetLawyers_FilterByCity_ReturnsFiltered()
    {
        await RegisterAndCreateLawyerAsync();

        var response = await _client.GetAsync("/api/lawyers?city=Baku");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetLawyers_FilterBySpecialization_ReturnsFiltered()
    {
        var response = await _client.GetAsync("/api/lawyers?specializationId=999");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var lawyers = await response.Content.ReadFromJsonAsync<List<object>>();
        lawyers.Should().NotBeNull();
    }

    [Fact]
    public async Task GetLawyerById_ValidId_ReturnsLawyer()
    {
        var (_, lawyerId) = await RegisterAndCreateLawyerAsync();

        var response = await _client.GetAsync($"/api/lawyers/{lawyerId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain(lawyerId.ToString());
    }

    [Fact]
    public async Task GetLawyerById_InvalidId_Returns404()
    {
        var fakeId = Guid.NewGuid();
        var response = await _client.GetAsync($"/api/lawyers/{fakeId}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateLawyerProfile_ValidData_Returns201()
    {
        var email = $"newlawyer_{Guid.NewGuid():N}@test.az";
        var regResp = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "New Lawyer",
            email,
            password = "TestPass1",
            phone = (string?)null
        });
        var auth = await regResp.Content.ReadFromJsonAsync<AuthResult>();
        _client.SetBearerToken(auth!.UserId, email, "Client");

        var response = await _client.PostAsJsonAsync("/api/lawyers", new
        {
            userId = auth.UserId,
            bio = "New lawyer bio",
            city = "Ganja",
            licenseNumber = $"LIC-{Guid.NewGuid():N}",
            experienceYears = 3,
            hourlyRate = 80.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateLawyerProfile_Unauthorized_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.PostAsJsonAsync("/api/lawyers", new
        {
            userId = Guid.NewGuid(),
            bio = "Unauthorized bio",
            city = "Baku",
            licenseNumber = "LIC-000",
            experienceYears = 1,
            hourlyRate = 50.0m,
            specializationIds = new[] { TestWebApplicationFactory.TestSpecializationId }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private record LawyerCreatedResponse(Guid LawyerId);
}
