import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, GeoJSON } from "react-leaflet";
import { useSafetyZones, useSafeStops } from "@/hooks/use-safety";
import { Icon, divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import L from "leaflet";

// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Location {
  lat: number;
  lng: number;
}

interface MapViewProps {
  center: Location;
  routes?: Array<{
    path: [number, number][];
    riskScore: number;
    category: "safe" | "moderate" | "unsafe";
    distance: string;
    duration: string;
    geometry: any;
  }>;
  zoom?: number;
  className?: string;
  onSelectStop?: (stop: any) => void;
  destination?: Location;
}

// Helper to update view when center changes
function ChangeView({ center, zoom, bounds }: { center: Location; zoom: number; bounds?: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      console.log("[MapView] Fitting bounds:", bounds.toBBoxString());
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, map, bounds]);
  return null;
}

export function MapView({ center, routes, zoom = 15, className, onSelectStop, destination }: MapViewProps) {
  const { data: zones } = useSafetyZones(center.lat, center.lng);
  const { data: stops } = useSafeStops(center.lat, center.lng);
  const [bounds, setBounds] = useState<L.LatLngBounds | undefined>();

  useEffect(() => {
    console.log(`[MapView] Start: ${center.lat}, ${center.lng}${destination ? ` | Dest: ${destination.lat}, ${destination.lng}` : ""}`);
    if (routes && routes.length > 0) {
      // Find bounding box encompassing all routes
      const latLngs = routes.flatMap(r => r.path).map(p => L.latLng(p[0], p[1]));
      setBounds(L.latLngBounds(latLngs));
    } else if (destination) {
      const latLngs = [L.latLng(center.lat, center.lng), L.latLng(destination.lat, destination.lng)];
      setBounds(L.latLngBounds(latLngs));
    } else {
      setBounds(undefined);
    }
  }, [routes, center, destination]);

  // Custom icons using divIcon for better styling
  const policeIcon = divIcon({
    className: 'custom-icon',
    html: `<div class="bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white w-9 h-9 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  const hospitalIcon = divIcon({
    className: 'custom-icon',
    html: `<div class="bg-red-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white w-9 h-9 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  const userIcon = divIcon({
    className: 'user-pulse',
    html: `<div class="relative flex items-center justify-center w-6 h-6">
      <div class="absolute w-full h-full bg-primary/30 rounded-full animate-ping"></div>
      <div class="relative w-4 h-4 bg-primary border-2 border-white rounded-full shadow-sm"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const destIcon = divIcon({
    className: 'dest-icon',
    html: `<div class="bg-destructive text-white p-1.5 rounded-full shadow-lg border-2 border-white w-8 h-8 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  // Calculate distance between two points in km
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      className={className} 
      zoomControl={false}
      style={{ background: '#f8fafc' }}
    >
      <ChangeView center={center} zoom={zoom} bounds={bounds} />
      
      {/* Sleek, modern map tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* User Location */}
      <Marker position={center} icon={userIcon} zIndexOffset={1000} />

      {/* Destination Location */}
      {destination && (
        <Marker position={destination} icon={destIcon} zIndexOffset={900} />
      )}

      {/* Route Line Rendering */}
      {routes?.map((route, idx) => {
        let routeColor = '#3b82f6'; // Blue for moderate
        if (route.category === 'safe') routeColor = '#10b981'; // Green for safe
        if (route.category === 'unsafe') routeColor = '#ef4444'; // Red for unsafe
        
        // Render safest route on top
        const zIndexOffset = route.category === 'safe' ? 500 : (route.category === 'moderate' ? 400 : 300);

        return (
          <GeoJSON 
            key={`route-${idx}`}
            data={route.geometry} 
            style={{ 
              color: routeColor, 
              weight: route.category === 'safe' ? 8 : 5, 
              opacity: route.category === 'safe' ? 0.9 : 0.6 
            }} 
          />
        );
      })}

      {/* Safety Zones */}
      {zones?.map((zone) => {
        let color = '#10b981'; // green
        if (zone.riskLevel === 'moderate') color = '#f59e0b'; // yellow
        if (zone.riskLevel === 'high') color = '#f43f5e'; // red

        return (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{ 
              color: color, 
              fillColor: color, 
              fillOpacity: 0.15,
              weight: 1,
              dashArray: '5, 5'
            }}
          >
            <Popup className="font-sans">
              <div className="text-sm font-medium">{zone.description || 'Safety Zone'}</div>
              <div className="text-xs text-muted-foreground capitalize">{zone.riskLevel} Risk</div>
            </Popup>
          </Circle>
        );
      })}

      {/* Safe Stops */}
      {stops?.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={stop.type === 'police' ? policeIcon : hospitalIcon}
          eventHandlers={{
            click: () => onSelectStop?.(stop)
          }}
        >
          <Popup className="font-sans min-w-[200px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-full text-white ${stop.type === 'police' ? 'bg-blue-600' : 'bg-red-500'}`}>
                  {stop.type === 'police' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  )}
                </div>
                <div className="font-bold text-sm">{stop.name}</div>
              </div>
              <div className="text-xs text-muted-foreground">{stop.address}</div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {getDistance(center.lat, center.lng, stop.lat, stop.lng)} km away
                </span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-primary gap-1">
                  <Navigation className="w-3 h-3" />
                  Directions
                </Button>
              </div>
              {stop.phone && (
                <a href={`tel:${stop.phone}`} className="block text-center p-1.5 bg-primary/5 rounded-lg text-xs text-primary font-medium hover:bg-primary/10 transition-colors">
                  Call {stop.type === 'police' ? 'Station' : 'Hospital'}
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
