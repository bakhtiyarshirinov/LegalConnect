using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalConnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"
    };

    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided" });

        if (file.Length > MaxFileSize)
            return BadRequest(new { message = "File exceeds the 10 MB limit" });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = $"File type '{ext}' is not allowed" });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "chat");
        Directory.CreateDirectory(uploadsDir);

        var safeFileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, safeFileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream, cancellationToken);

        return Ok(new
        {
            url       = $"/uploads/chat/{safeFileName}",
            fileName  = file.FileName,
            fileSize  = file.Length,
            mimeType  = file.ContentType,
        });
    }
}
