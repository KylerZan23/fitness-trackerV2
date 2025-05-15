/**
 * Run Map Component
 * ------------------------------------------------
 * This component displays a run route on a map using Leaflet
 */

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { decodePolyline, calculateBounds } from '@/lib/polyline';

// Define types locally to avoid importing from leaflet on the server side
type LatLngTuple = [number, number];
type LatLngExpression = LatLngTuple | { lat: number; lng: number };

// Helper function to check if two coordinate points are equal
function isEqual(a: LatLngTuple, b: LatLngTuple): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

// Import Leaflet CSS only on the client side
const LeafletCSS = () => {
  useEffect(() => {
    // Dynamic import of CSS to ensure it only loads on client
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    link.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==';
    link.crossOrigin = '';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  
  return null;
};

// Dynamically import Leaflet components with no SSR to avoid "window is not defined" errors
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

// Custom component to set map bounds
// Dynamically imported to avoid SSR issues
const BoundsSetter = dynamic(
  () => import('react-leaflet').then((mod) => {
    const useMap = mod.useMap;
    
    return function BoundsSetter({ bounds }: { bounds: [[number, number], [number, number]] }) {
      const map = useMap();
      
      useEffect(() => {
        if (bounds[0][0] !== 0 || bounds[0][1] !== 0 || bounds[1][0] !== 0 || bounds[1][1] !== 0) {
          // Only import and use Leaflet's LatLngBounds on the client side
          import('leaflet').then(({ LatLngBounds }) => {
            const latLngBounds = new LatLngBounds(bounds[0], bounds[1]);
            map.fitBounds(latLngBounds, { padding: [50, 50] });
          });
        }
      }, [map, bounds]);
      
      return null;
    };
  }),
  { ssr: false }
);

interface RunMapProps {
  polyline: string;
  className?: string;
  height?: string;
}

export function RunMap({ polyline, className = "", height = "400px" }: RunMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [defaultIcon, setDefaultIcon] = useState<any | null>(null);
  
  // Initialize on client-side only
  useEffect(() => {
    // Only import and use Leaflet's Icon on the client side
    const setupLeaflet = async () => {
      const L = await import('leaflet');
      setDefaultIcon(
        new L.Icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      );
      setIsMounted(true);
    };
    
    setupLeaflet();
  }, []);
  
  // Decode the polyline into coordinates
  const coordinates = useMemo(() => {
    return decodePolyline(polyline || "");
  }, [polyline]);

  // Calculate bounds for the map view
  const bounds = useMemo(() => {
    return calculateBounds(coordinates);
  }, [coordinates]);

  // Get start and end points
  const startPoint: LatLngTuple = coordinates.length > 0 ? [coordinates[0][0], coordinates[0][1]] : [0, 0];
  const endPoint: LatLngTuple = coordinates.length > 0 ? [coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]] : [0, 0];

  // Determine if we have valid coordinates
  const hasValidCoordinates = coordinates.length > 0 && 
    !(startPoint[0] === 0 && startPoint[1] === 0);

  if (!hasValidCoordinates) {
    return (
      <div 
        className={`flex items-center justify-center bg-white/5 text-white/50 rounded-lg ${className}`}
        style={{ height }}
      >
        No route data available
      </div>
    );
  }

  // Don't render the map on server-side
  if (!isMounted) {
    return (
      <div 
        className={`flex items-center justify-center bg-white/5 text-white/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // Map center point (will be overridden by bounds)
  const center: LatLngTuple = [0, 0];

  return (
    <div className={className} style={{ height }}>
      <LeafletCSS />
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      >
        {/* Replace dark mode tile layer with standard OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* The route polyline */}
        <Polyline 
          positions={coordinates as LatLngExpression[]}
          pathOptions={{ color: '#fc5200', weight: 4, opacity: 0.7 }}
        />
        
        {/* Start marker */}
        {defaultIcon && (
          <Marker 
            position={startPoint} 
            icon={defaultIcon}
          />
        )}
        
        {/* End marker */}
        {defaultIcon && !isEqual(startPoint, endPoint) && (
          <Marker 
            position={endPoint} 
            icon={defaultIcon}
          />
        )}
        
        {/* Set the map bounds based on the route */}
        <BoundsSetter bounds={bounds} />
      </MapContainer>
    </div>
  );
} 