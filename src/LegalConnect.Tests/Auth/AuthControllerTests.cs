using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LegalConnect.Application.Common.Models;
using LegalConnect.Tests.Helpers;

namespace LegalConnect.Tests.Auth;

public class AuthControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RegisterClient_ValidData_Returns200()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Anar Mammadov",
            email = $"anar_{Guid.NewGuid():N}@test.az",
            password = "TestPass1",
            phone = (string?)null
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResult>();
        result.Should().NotBeNull();
        result!.Token.Should().NotBeEmpty();
        result.Email.Should().NotBeEmpty();
    }

    [Fact]
    public async Task RegisterClient_DuplicateEmail_Returns409()
    {
        var email = $"dup_{Guid.NewGuid():N}@test.az";
        var payload = new
        {
            fullName = "Duplicate User",
            email,
            password = "TestPass1",
            phone = (string?)null
        };

        await _client.PostAsJsonAsync("/api/auth/register/client", payload);
        var response = await _client.PostAsJsonAsync("/api/auth/register/client", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task RegisterClient_InvalidEmail_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Bad Email User",
            email = "not-an-email",
            password = "TestPass1",
            phone = (string?)null
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RegisterClient_WeakPassword_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Weak Pass User",
            email = $"weakpass_{Guid.NewGuid():N}@test.az",
            password = "weak",
            phone = (string?)null
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var email = $"login_{Guid.NewGuid():N}@test.az";
        const string password = "TestPass1";

        await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Login Test User",
            email,
            password,
            phone = (string?)null
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new { email, password });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResult>();
        result.Should().NotBeNull();
        result!.Token.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Login_InvalidPassword_Returns401()
    {
        var email = $"loginbad_{Guid.NewGuid():N}@test.az";

        await _client.PostAsJsonAsync("/api/auth/register/client", new
        {
            fullName = "Login Bad Pass User",
            email,
            password = "TestPass1",
            phone = (string?)null
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = "WrongPass1"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_NonExistentEmail_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "nobody@nowhere.com",
            password = "TestPass1"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
