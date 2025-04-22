# Strava-like Activity Card Implementation Plan

## Overview
We need to implement a Strava-like activity card component that will display run details with a map visualization of the route, similar to the provided reference image.

## Requirements
1. Display user info and run metadata (name, date, location)
2. Show run statistics (distance, pace, time)
3. Display achievements/segments if available
4. Show a map with the run route using the polyline data
5. Style the card to match the Strava aesthetic

## Dependencies to Add
1. `@react-leaflet/core` and `react-leaflet` - For the interactive map
2. `leaflet` - Base library for maps
3. `polyline-decoder` - To decode Strava's polyline format

## Implementation Steps

### 1. Create Component Structure
- Create a new `RunCard.tsx` component
- Create a `RunMap.tsx` component for the map visualization
- Create a `PolylineDecoder.ts` utility for decoding the route

### 2. Modify Strava API Interface
- Ensure the Strava API fetch retrieves the polyline data (already defined in interface)
- Add fetch for individual run details with complete route data

### 3. Create the RunMap Component
- Implement Leaflet map with the decoded polyline
- Add markers for start/end points
- Style the map to match the dark theme of the application

### 4. Create the RunCard Component
- Implement the card layout with user info, statistics, and map
- Add styling to match the Strava aesthetic
- Include conditional rendering for achievements/segments

### 5. Integrate with RunList Component
- Modify the RunList component to use the new RunCard component
- Add a new detail view option to see the full RunCard

### 6. Add Responsive Design
- Ensure the card works well on all device sizes
- Create appropriate breakpoints for different layouts

## Implementation Details

### RunMap Component
- Use Leaflet with the react-leaflet wrapper
- Create utility function to decode polyline strings
- Set appropriate zoom level and center based on the route
- Include custom markers for start/end points

### RunCard Component
- Two sections: info header and map/stats section
- Consistent styling with the rest of the application
- Integrate with existing unit conversion utilities
- Badge-style display for achievements

## Server-Side Rendering Fix

To address the "window is not defined" error when using Leaflet with Next.js:

1. **Dynamic Imports**: Use Next.js's dynamic import function with `{ ssr: false }` option for all Leaflet components:
   ```typescript
   const MapContainer = dynamic(
     () => import('react-leaflet').then((mod) => mod.MapContainer),
     { ssr: false }
   );
   ```

2. **Client-side initialization**: Initialize Leaflet-related objects only on the client side with useEffect:
   ```typescript
   useEffect(() => {
     setIsMounted(true);
     setDefaultIcon(createDefaultIcon());
   }, []);
   ```

3. **Conditional rendering**: Only render the map when the component is mounted on the client:
   ```typescript
   if (!isMounted) {
     return <LoadingPlaceholder />;
   }
   ```

4. **CSS imports**: Import Leaflet CSS only on the client side:
   ```typescript
   const LeafletCSS = () => {
     useEffect(() => {
       import('leaflet/dist/leaflet.css');
     }, []);
     return null;
   };
   ```

This approach ensures that Leaflet code only runs in the browser environment where the `window` object is available.

## Testing Plan
1. Test with various polyline data to ensure proper rendering
2. Test responsive design across different device sizes
3. Verify that the map properly centers on the route
4. Test with missing or malformed data to ensure graceful fallbacks
5. Test server-side rendering with and without JavaScript enabled

## Future Enhancements
1. Add elevation profile chart
2. Implement detailed segment information
3. Add the ability to compare runs on the same route
4. Show mile/kilometer split times 