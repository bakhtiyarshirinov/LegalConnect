using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace LegalConnect.Tests.Helpers;

public static class AuthHelper
{
    private const string SecretKey = "CHANGE_ME_USE_AT_LEAST_32_CHARACTERS_SECRET_KEY";
    private const string Issuer = "LegalConnect";
    private const string Audience = "LegalConnect.Client";

    public static string GenerateTestToken(Guid userId, string email, string role, string fullName = "Test User")
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SecretKey));
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.Name, fullName),
        };

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static void SetBearerToken(this HttpClient client, Guid userId, string email, string role)
    {
        var token = GenerateTestToken(userId, email, role);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}

public static class TestUsers
{
    public static readonly Guid ClientId = Guid.NewGuid();
    public const string ClientEmail = "testclient@test.com";
    public const string ClientPassword = "TestPass1";
    public const string ClientFullName = "Test Client";

    public static readonly Guid LawyerId = Guid.NewGuid();
    public const string LawyerEmail = "testlawyer@test.com";
    public const string LawyerPassword = "TestPass1";
    public const string LawyerFullName = "Test Lawyer";

    public static readonly Guid AdminId = Guid.NewGuid();
    public const string AdminEmail = "testadmin@test.com";
    public const string AdminFullName = "Test Admin";
}
