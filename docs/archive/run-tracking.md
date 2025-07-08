# Run Tracking & Strava Integration

FitnessTracker V2 provides comprehensive run tracking capabilities with Strava integration, interactive maps, and a modern card-based interface.

## Features

### Strava Integration

- **OAuth Authentication**: Securely connect to your Strava account
- **Automatic Syncing**: Import your runs and activities from Strava
- **Fetch Run Details**: View detailed information about each run
- **Manual Logging**: Log runs directly to your Strava account

### Interactive Maps

- **Route Visualization**: View your run routes on interactive maps
- **Polyline Decoding**: Automatically converts Strava's encoded polylines
- **Start/End Markers**: Easily identify where your run started and ended
- **Responsive Design**: Maps adjust to fit different screen sizes

### Strava-like Activity Cards

Our activity cards are designed to mimic the Strava experience:

- **User Information**: Profile picture, name, and location
- **Run Statistics**: Distance, pace, and time
- **Map View**: Interactive map showing the run route
- **Segments**: View segment efforts and achievements
- **Expandable Layout**: Toggle between compact and expanded views

### Dual View Options

- **Card View**: Visual display with maps and detailed information
- **Table View**: Classic tabular view for quick comparison of runs
- **Detail View**: Expanded view of a single run with full details

## How to Use

### Connecting to Strava

1. Navigate to the Run Logger page
2. Click the "Connect to Strava" button
3. Authorize FitnessTracker V2 to access your Strava data
4. Once connected, your runs will be displayed automatically

### Viewing Your Runs

- **Card View (Default)**: Shows runs as Strava-like cards with maps
- **Table View**: Switch to this tab for a traditional tabular view
- **Details**: Click "View Details" on any run card to see more information

### Logging a Run Manually

1. Go to the "Log Run" tab
2. Enter run details:
   - Name
   - Date and time
   - Distance (in miles)
   - Duration (hours, minutes, seconds)
   - Description (optional)
3. Click "Log Run" to submit

## Technical Details

### Maps & Routes

- Built with Leaflet.js and React-Leaflet
- Dark-themed map tiles for consistency with app theme
- Polyline decoder for converting Strava's encoded route data
- Customized markers for start and end points

### Server-Side Rendering Considerations

The map components use special handling to work correctly with Next.js's server-side rendering:

1. **Dynamic Imports**: All Leaflet components are dynamically imported with the `ssr: false` option to prevent them from loading during server rendering
2. **Client-Side Initialization**: Maps are only initialized after the component mounts in the browser
3. **Loading States**: Appropriate loading states are shown while waiting for the map to initialize
4. **Graceful Degradation**: The application works even if JavaScript is disabled or if maps fail to load

This approach prevents the "window is not defined" error that would otherwise occur when Leaflet attempts to access browser-specific objects during server rendering.

### Data Handling

- All data is stored in your Strava account
- Imperial units used throughout (miles, feet, minutes/mile)
- Automatic conversion between metric (Strava) and imperial (display) units

### Performance Considerations

- Lazy loading of map components
- On-demand fetching of detailed run data
- Efficient polyline decoding

## Troubleshooting

### Common Issues

- **No runs showing**: Make sure your Strava account is connected and you have activities
- **Map not displaying**: Check your internet connection
- **Can't connect to Strava**: Try disconnecting and reconnecting your account

### Further Help

If you encounter any issues with the run tracking feature, please:

1. Check that your Strava account is correctly connected
2. Ensure you've granted all the required permissions
3. Try disconnecting and reconnecting your account
4. Contact support if problems persist
