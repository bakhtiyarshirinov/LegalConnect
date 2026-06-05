using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using LegalConnect.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace LegalConnect.Infrastructure.Services;

public class DailyService : IDailyService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _domain;

    public DailyService(IHttpClientFactory factory, IConfiguration configuration)
    {
        _http = factory.CreateClient("Daily");
        var s = configuration.GetSection("DailySettings");
        _apiKey = s["ApiKey"] ?? throw new InvalidOperationException("DailySettings:ApiKey not configured");
        _domain = s["Domain"] ?? throw new InvalidOperationException("DailySettings:Domain not configured");
    }

    public async Task<string> CreateRoomAsync(Guid appointmentId)
    {
        var roomName = $"appointment-{appointmentId}";
        var exp = DateTimeOffset.UtcNow.AddHours(2).ToUnixTimeSeconds();

        var body = JsonSerializer.Serialize(new
        {
            name = roomName,
            privacy = "private",
            properties = new { exp }
        });

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.daily.co/v1/rooms")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return $"https://{_domain}/{roomName}";
    }

    public async Task DeleteRoomAsync(string roomName)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, $"https://api.daily.co/v1/rooms/{roomName}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }
}
