# LightTrace UI

A responsive web interface for monitoring and analyzing LightTrace performance data.

## Features

- **Real-time Trace Monitoring**: View trace reports in rendered markdown format
- **Configuration Display**: See current LightTrace configuration settings
- **Server-Side Configuration Injection**: Base path is automatically injected from `LightTraceOptions`
- **Interactive Controls**:
  - **Refresh**: Manually refresh trace data
  - **Download Report**: Download trace report as markdown file
  - **Reset Traces**: Clear all collected trace data
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