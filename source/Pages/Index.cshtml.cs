using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using YoutubeExplode;
using YoutubeExplode.Converter;

namespace YoutubeDownloader.Pages
{
    public class IndexModel : PageModel
    {
        [BindProperty]
        public string Url { get; set; }

        [BindProperty]
        public string Format { get; set; }

        public string StatusMessage { get; set; }

        public async Task<IActionResult> OnPostAsync()
        {
            if (string.IsNullOrWhiteSpace(Url))
            {
                StatusMessage = "⚠️ Please enter a valid YouTube URL.";
                return Page();
            }

            string outputDir = Path.Combine(Path.GetTempPath(), "yt-downloads");
            Directory.CreateDirectory(outputDir);

            var youtube = new YoutubeClient();
            var video = await youtube.Videos.GetAsync(Url);

            string ext = Format == "mp3" ? "mp3" : "mp4";
            string fileName = $"{video.Title}.{ext}";
            string filePath = Path.Combine(outputDir, fileName);

            try
            {
                // Use YoutubeExplode.Converter for automatic ffmpeg handling
                await youtube.Videos.DownloadAsync(
                    Url,
                    filePath,
                    builder => builder.SetContainer(ext) // mp4 or mp3
                );

                return PhysicalFile(filePath, Format == "mp3" ? "audio/mpeg" : "video/mp4", fileName);
            }
            catch (Exception)
            {
                // fallback to yt-dlp if YoutubeExplode fails
                string outputTemplate = Path.Combine(outputDir, "%(title)s.%(ext)s");
                string args = Format == "mp3"
                    ? $"-x --audio-format mp3 -o \"{outputTemplate}\" \"{Url}\""
                    : $"-f mp4 -o \"{outputTemplate}\" \"{Url}\"";

                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "yt-dlp.exe",
                    Arguments = args,
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden   // 👈 ensures no window flashes
                };

                using var process = System.Diagnostics.Process.Start(psi);
                string output = process.StandardOutput.ReadToEnd();
                string error = process.StandardError.ReadToEnd();
                process.WaitForExit();

                var file = Directory.GetFiles(outputDir)
                    .Select(f => new FileInfo(f))
                    .OrderByDescending(f => f.LastWriteTime)
                    .FirstOrDefault();

                if (file == null)
                {
                    StatusMessage = "❌ Download failed.";
                    return Page();
                }

                return PhysicalFile(file.FullName, Format == "mp3" ? "audio/mpeg" : "video/mp4", file.Name);
            }
        }
    }
}
