using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add Razor Pages
builder.Services.AddRazorPages();

// Force Kestrel to listen only on localhost:5000
builder.WebHost.UseUrls("http://localhost:5000");

var app = builder.Build();

// Configure middleware pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // no HSTS / HTTPS redirection since you're using HTTP only
}

app.UseStaticFiles();
app.UseRouting();
app.MapRazorPages();

app.Run();
