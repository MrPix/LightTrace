using Microsoft.Extensions.DependencyInjection;

namespace LightTrace.UI;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddLightTrace(this IServiceCollection services, Action<LightTraceOptions>? configure = null)
    {
        var options = new LightTraceOptions();
        configure?.Invoke(options);

        services.AddSingleton(options);

        return services;
    }
}