# LightTrace UI

A responsive web interface for monitoring and analyzing LightTrace performance data.

## Features

- **Real-time Trace Monitoring**: View trace reports in rendered markdown format
- **Configuration Display**: See current LightTrace configuration settings
- **Server-Side Configuration Injection**: Base path is automatically injected from `LightTraceOptions`
- **Interactive Controls**:
  - ?? **Refresh**: Manually refresh trace data
  - ?? **Download Report**: Download trace report as markdown file
  - ??? **Reset Traces**: Clear all collected trace data
- **Auto-refresh**: Automatically updates trace data every 30 seconds
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Usage

1. Add LightTrace UI to your ASP.NET Core application:

```csharp
builder.Services.AddLightTrace(options =>
{
    options.BasePath = "/monitoring"; // Optional: customize the base path
    options.EnableUI = true; // Default: true
});

app.UseLightTrace();
```

2. Navigate to your configured base path in your browser (e.g., `/monitoring` or `/lighttrace`)

## Configuration Injection

The UI automatically receives the correct configuration through server-side injection:

1. **Server-Side Injection**: When `index.html` is served, the middleware injects a `window.LightTraceConfig` object containing:
   ```javascript
   window.LightTraceConfig = {
       basePath: '/your-configured-path',
       enableUI: true
   };
   ```

2. **Client-Side Usage**: The JavaScript application reads this configuration and uses the correct base path for all API calls

3. **Fallback Strategy**: If the injected config is not available, it falls back to URL-based detection

This approach ensures the UI always uses the exact same base path as configured in your `LightTraceOptions`, eliminating any synchronization issues.

## API Endpoints

The UI communicates with these API endpoints (relative to your configured `BasePath`):

- `GET {BasePath}/api/traces` - Get trace report as markdown
- `GET {BasePath}/api/traces/download` - Download trace report
- `GET {BasePath}/api/traces/configuration` - Get configuration
- `GET {BasePath}/api/traces/reset` - Reset all traces

## Configuration Options

```csharp
builder.Services.AddLightTrace(options =>
{
    options.BasePath = "/monitoring";  // Change the base URL path
    options.EnableUI = true;           // Enable/disable the web UI
});
```

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Markdown Rendering**: Marked.js library
- **Configuration**: Server-side injection for seamless integration
- **Styling**: Modern CSS with responsive design
- **Icons**: Unicode emoji for cross-platform compatibility

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)