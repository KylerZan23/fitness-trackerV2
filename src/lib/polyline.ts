/**
 * Polyline Utilities
 * ------------------------------------------------
 * Utility functions for working with encoded polylines from Strava
 */

/**
 * Decodes an encoded polyline string into an array of [latitude, longitude] coordinates
 * Based on the algorithm described by Google: 
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 * 
 * @param encoded The encoded polyline string
 * @returns Array of [lat, lng] coordinate pairs
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded || encoded.length === 0) {
    return [];
  }

  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    // Convert to coordinates with 5 decimal places precision
    // Divide by 1e5 to convert from the polyline format
    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Calculates the center point of a polyline
 * 
 * @param coordinates Array of [lat, lng] coordinate pairs
 * @returns The center point as [lat, lng]
 */
export function calculateCenter(coordinates: [number, number][]): [number, number] {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0];
  }

  const sumLat = coordinates.reduce((sum, coord) => sum + coord[0], 0);
  const sumLng = coordinates.reduce((sum, coord) => sum + coord[1], 0);
  
  return [
    sumLat / coordinates.length,
    sumLng / coordinates.length
  ];
}

/**
 * Calculates a bounding box for a set of coordinates
 * 
 * @param coordinates Array of [lat, lng] coordinate pairs
 * @returns Bounding box as [[south, west], [north, east]]
 */
export function calculateBounds(coordinates: [number, number][]): [[number, number], [number, number]] {
  if (!coordinates || coordinates.length === 0) {
    return [[0, 0], [0, 0]];
  }

  let minLat = coordinates[0][0];
  let maxLat = coordinates[0][0];
  let minLng = coordinates[0][1];
  let maxLng = coordinates[0][1];

  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord[0]);
    maxLat = Math.max(maxLat, coord[0]);
    minLng = Math.min(minLng, coord[1]);
    maxLng = Math.max(maxLng, coord[1]);
  });

  return [
    [minLat, minLng], // Southwest corner
    [maxLat, maxLng]  // Northeast corner
  ];
} 