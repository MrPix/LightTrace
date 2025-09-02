using LightTrace.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using System.Text.Json;

namespace LightTrace.UI;

public class LightTraceMiddleware
{
    private readonly RequestDelegate _next;
    private readonly LightTraceOptions _options;
    private static readonly EmbeddedFileProvider FileProvider =
        new(typeof(LightTraceMiddleware).Assembly, "LightTrace.UI.wwwroot");

    public LightTraceMiddleware(RequestDelegate next, LightTraceOptions options)
    {
        _next = next;
        _options = options;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        // Handle API endpoints
        if (path.StartsWith($"{_options.BasePath}/api"))
        {
            await HandleApiRequest(context);
            return;
        }

        // Handle UI files
        if (path.StartsWith($"{_options.BasePath}/") && _options.EnableUI)
        {
            await HandleStaticFile(context);
            return;
        }

        await _next(context);
        return;
    }

    private async Task HandleApiRequest(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        if (path.EndsWith("/traces"))
        {
            var traces = Tracer.GetTraceEntries();
            var mdReport = traces.AsMdReportString();

            if (context.Request.Method == "GET")
            {
                await WriteTextResponse(context, mdReport);
                return;
            }
        }
        else if (path.EndsWith("/traces/download"))
        {
            var traces = Tracer.GetTraceEntries();
            var mdReport = traces.AsMdReportString();
            if (context.Request.Method == "GET")
            {
                context.Response.Headers.Add("Content-Disposition", "attachment; filename=LightTrace_Report.md");
                await WriteTextResponse(context, mdReport);
                return;
            }
        }
        else if (path.EndsWith("configuration"))
        {
            if (context.Request.Method == "GET")
            {
                await WriteJsonResponse(context, _options);
                return;
            }
        }
        else if (path.EndsWith("/reset"))
        {
            if (context.Request.Method == "GET")
            {
                Tracer.Reset();
                context.Response.StatusCode = 200;
                await context.Response.WriteAsync("Traces reset successfully");
            }
            return;
        }
        else
        {
            context.Response.StatusCode = 404;
            return;
        }
    }

    private async Task HandleStaticFile(HttpContext context)
    {
        var path = context.Request.Path.Value!;
        var filePath = path.Replace(_options.BasePath, "").TrimStart('/');

        if (string.IsNullOrEmpty(filePath) || filePath == "/")
            filePath = "index.html";

        var fileInfo = FileProvider.GetFileInfo(filePath);

        if (fileInfo.Exists)
        {
            var contentType = GetContentType(filePath);
            context.Response.ContentType = contentType;

            // Special handling for index.html to inject configuration
            if (filePath == "index.html")
            {
                await ServeIndexWithConfig(context, fileInfo);
            }
            else
            {
                using var stream = fileInfo.CreateReadStream();
                await stream.CopyToAsync(context.Response.Body);
            }
        }
        else
        {
            context.Response.StatusCode = 404;
        }
    }

    private async Task ServeIndexWithConfig(HttpContext context, IFileInfo fileInfo)
    {
        using var stream = fileInfo.CreateReadStream();
        using var reader = new StreamReader(stream);
        var htmlContent = await reader.ReadToEndAsync();

        // Inject the base path configuration into the HTML
        var configScript = $@"
    <script>
        window.LightTraceConfig = {{
            basePath: '{_options.BasePath}',
            enableUI: {(_options.EnableUI ? "true" : "false")}
        }};
    </script>";

        // Insert the config script before the closing </head> tag
        htmlContent = htmlContent.Replace("</head>", $"{configScript}\n</head>");

        await context.Response.WriteAsync(htmlContent);
    }

    private static async Task WriteTextResponse(HttpContext context, string text)
    {
        context.Response.ContentType = "text/plain";
        await context.Response.WriteAsync(text);
    }

    private static async Task WriteJsonResponse(HttpContext context, object data)
    {
        context.Response.ContentType = "application/json";
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });
        await context.Response.WriteAsync(json);
    }

    private static string GetContentType(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        return extension switch
        {
            ".html" => "text/html",
            ".css" => "text/css",
            ".js" => "application/javascript",
            ".json" => "application/json",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".svg" => "image/svg+xml",
            ".ico" => "image/x-icon",
            _ => "application/octet-stream"
        };
    }
}
