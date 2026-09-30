'use client';

import React, { useEffect, useRef } from 'react';
import { Reminder } from '@/types';
import { Navigation, Compass } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface RadarMapProps {
  reminders: Reminder[];
  userLat?: number | null;
  userLng?: number | null;
  onSelectCoordinates?: (lat: number, lng: number) => void;
}

export const RadarMap: React.FC<RadarMapProps> = ({
  reminders,
  userLat = 37.7749,
  userLng = -122.4194,
  onSelectCoordinates,
}) => {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const circlesLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to support Next.js SSR
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default marker icon assets
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const centerLat = userLat || 37.7749;
      const centerLng = userLng || -122.4194;

      // Ensure container doesn't retain old leaflet ID
      if (!mapInstanceRef.current) {
        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 15,
          zoomControl: false,
        });

        const tileUrl = theme === 'light'
          ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

        const tiles = L.tileLayer(tileUrl, {
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        tileLayerRef.current = tiles;
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Click to relocate GPS or select coordinates
        map.on('click', (e: any) => {
          onSelectCoordinates?.(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        circlesLayerRef.current = L.layerGroup().addTo(map);

        // Invalidate size to guarantee tiles render properly inside animated/mobile containers
        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 250);
      }

      const map = mapInstanceRef.current;

      // Update Tile Layer if theme changed
      if (tileLayerRef.current && map) {
        map.removeLayer(tileLayerRef.current);
        const tileUrl = theme === 'light'
          ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

        tileLayerRef.current = L.tileLayer(tileUrl, {
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);
      }

      // Update User Beacon Marker
      if (userMarkerRef.current && map) {
        map.removeLayer(userMarkerRef.current);
      }

      const beaconColor = theme === 'light' ? '#09090b' : '#ffffff';
      const userIcon = L.divIcon({
        className: 'custom-user-beacon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background: ${beaconColor}; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; background: ${beaconColor}; border: 2px solid ${theme === 'light' ? '#ffffff' : '#000000'}; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); z-index: 10;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = L.marker([centerLat, centerLng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>Your Position</b><br/>${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`);

      // Update Active Reminder Geofences
      if (circlesLayerRef.current) {
        circlesLayerRef.current.clearLayers();

        const activeLocReminders = reminders.filter(
          (r) => r.status === 'active' && r.latitude && r.longitude
        );

        activeLocReminders.forEach((r) => {
          const lat = r.latitude!;
          const lng = r.longitude!;
          const radius = r.radius_meters || 200;

          const circleColor = theme === 'light' ? '#18181b' : '#fafafa';

          L.circle([lat, lng], {
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.15,
            weight: 2,
            radius,
          }).addTo(circlesLayerRef.current);

          const popupContent = `
            <div style="padding: 4px; font-family: inherit;">
              <strong style="font-size: 13px; font-weight: 700;">${r.title}</strong><br/>
              <span style="font-size: 11px; opacity: 0.8;">📍 ${r.address || 'Geofenced Zone'}</span><br/>
              <span style="font-size: 11px; opacity: 0.9;">Radius: ${radius}m</span><br/>
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase;">Priority: ${r.priority}</span>
            </div>
          `;

          const pinIcon = L.divIcon({
            className: 'custom-place-pin',
            html: `
              <div style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 9999px; background: ${theme === 'light' ? '#000000' : '#ffffff'}; color: ${theme === 'light' ? '#ffffff' : '#000000'}; font-size: 11px; font-weight: bold; border: 2px solid ${theme === 'light' ? '#ffffff' : '#000000'}; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                📍
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          L.marker([lat, lng], { icon: pinIcon })
            .addTo(circlesLayerRef.current)
            .bindPopup(popupContent);
        });
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLat, userLng, reminders, theme, onSelectCoordinates]);

  // Recenter map on user location
  const handleRecenter = () => {
    if (mapInstanceRef.current && userLat && userLng) {
      mapInstanceRef.current.setView([userLat, userLng], 15, { animate: true });
    }
  };

  const activeGeofences = reminders.filter((r) => r.status === 'active' && r.latitude).length;

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[380px] rounded-3xl overflow-hidden glass-panel border border-neutral-200 dark:border-neutral-800 shadow-2xl">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Info Pill */}
      <div className="absolute top-3 left-3 z-[400] glass-panel-elevated px-3 py-1.5 rounded-full text-[11px] font-medium text-neutral-900 dark:text-neutral-100 flex items-center space-x-2 border border-neutral-200 dark:border-neutral-800">
        <Compass className="w-3.5 h-3.5" />
        <span>
          {activeGeofences} Geofence{activeGeofences === 1 ? '' : 's'} Active
        </span>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        className="absolute bottom-4 left-4 z-[400] glass-panel-elevated px-3 py-2 rounded-2xl text-neutral-900 dark:text-white bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-all shadow-lg flex items-center space-x-1.5 text-xs font-semibold"
      >
        <Navigation className="w-4 h-4" />
        <span>Recenter GPS</span>
      </button>
    </div>
  );
};
