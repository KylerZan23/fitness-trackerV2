/**
 * Polyline utility functions for working with encoded polylines
 * Used for GPS route data and mapping functionality
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Decode a polyline encoded string to an array of coordinates
 * @param encoded - The encoded polyline string
 * @returns Array of coordinate objects with lat/lng
 */
export function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
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

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return coordinates;
}

/**
 * Calculate bounds for an array of coordinates
 * @param coordinates - Array of coordinate objects
 * @returns Bounds object with north, south, east, west values
 */
export function calculateBounds(coordinates: Coordinate[]): Bounds {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = coordinates[0].lat;
  let south = coordinates[0].lat;
  let east = coordinates[0].lng;
  let west = coordinates[0].lng;

  for (const coord of coordinates) {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  }

  return { north, south, east, west };
}

/**
 * Calculate the center point of an array of coordinates
 * @param coordinates - Array of coordinate objects
 * @returns Center coordinate
 */
export function calculateCenter(coordinates: Coordinate[]): Coordinate {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const bounds = calculateBounds(coordinates);
  
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
}

/**
 * Encode an array of coordinates to a polyline string
 * @param coordinates - Array of coordinate objects
 * @returns Encoded polyline string
 */
export function encodePolyline(coordinates: Coordinate[]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const coord of coordinates) {
    const lat = Math.round(coord.lat * 1e5);
    const lng = Math.round(coord.lng * 1e5);
    
    const deltaLat = lat - prevLat;
    const deltaLng = lng - prevLng;
    
    encoded += encodeSignedInteger(deltaLat);
    encoded += encodeSignedInteger(deltaLng);
    
    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
}

/**
 * Helper function to encode a signed integer for polyline encoding
 */
function encodeSignedInteger(num: number): string {
  let encoded = '';
  const sgn_num = num << 1;
  const shifted = num < 0 ? ~sgn_num : sgn_num;
  
  let remaining = shifted;
  while (remaining >= 0x20) {
    encoded += String.fromCharCode((0x20 | (remaining & 0x1f)) + 63);
    remaining >>= 5;
  }
  
  encoded += String.fromCharCode(remaining + 63);
  return encoded;
}
