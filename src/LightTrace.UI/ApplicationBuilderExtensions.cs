using Microsoft.AspNetCore.Builder;

namespace LightTrace.UI;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseLightTrace(this IApplicationBuilder app)
    {
        app.UseMiddleware<LightTraceMiddleware>();
        return app;
    }
}
