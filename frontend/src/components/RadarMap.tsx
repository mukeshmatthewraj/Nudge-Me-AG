'use client';

import React, { useEffect, useRef } from 'react';
import { Reminder } from '@/types';
import { MapPin, Navigation, Info } from 'lucide-react';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const circlesLayerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default marker icons path
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const centerLat = userLat || 37.7749;
      const centerLng = userLng || -122.4194;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 15,
          zoomControl: false,
        });

        // Dark theme tiles for modern aesthetic
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Click on map to relocate or inspect
        map.on('click', (e: any) => {
          onSelectCoordinates?.(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        circlesLayerRef.current = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;

      // Update user marker and beacon
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }

      // Custom User beacon marker
      const userIcon = L.divIcon({
        className: 'custom-user-beacon',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <div class="absolute w-6 h-6 bg-indigo-500 rounded-full animate-ping opacity-50"></div>
            <div class="w-3.5 h-3.5 bg-indigo-400 border-2 border-white rounded-full shadow-lg z-10"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = L.marker([centerLat, centerLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Current Location</b><br/>Live GPS Beacon');

      // Update geofence circles for active location reminders
      if (circlesLayerRef.current) {
        circlesLayerRef.current.clearLayers();

        const activeLocReminders = reminders.filter(
          (r) => r.status === 'active' && r.latitude && r.longitude
        );

        activeLocReminders.forEach((r) => {
          const lat = r.latitude!;
          const lng = r.longitude!;
          const radius = r.radius_meters || 200;

          // Circle color based on priority
          const color = r.priority === 'High' ? '#f43f5e' : r.priority === 'Medium' ? '#f59e0b' : '#10b981';

          const circle = L.circle([lat, lng], {
            color,
            fillColor: color,
            fillOpacity: 0.18,
            weight: 2,
            radius,
          }).addTo(circlesLayerRef.current);

          const popupContent = `
            <div style="color: #0f172a; font-family: sans-serif; padding: 2px;">
              <strong style="font-size: 13px;">${r.title}</strong><br/>
              <span style="font-size: 11px; color: #475569;">📍 ${r.address || 'Target Location'}</span><br/>
              <span style="font-size: 11px; color: #0284c7;">Geofence Radius: ${radius}m</span><br/>
              <span style="font-size: 10px; font-weight: bold; color: ${color}; text-transform: uppercase;">Priority: ${r.priority}</span>
            </div>
          `;

          circle.bindPopup(popupContent);

          // Place marker pin at center
          const placeIcon = L.divIcon({
            className: 'custom-place-icon',
            html: `
              <div class="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900/90 border border-white text-white text-[10px] font-bold shadow-md" style="border-color: ${color}">
                📍
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          L.marker([lat, lng], { icon: placeIcon })
            .addTo(circlesLayerRef.current)
            .bindPopup(popupContent);
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userLat, userLng, reminders, onSelectCoordinates]);

  // Recenter map on user location
  const handleRecenter = () => {
    if (mapInstanceRef.current && userLat && userLng) {
      mapInstanceRef.current.setView([userLat, userLng], 15, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[380px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Info Overlay */}
      <div className="absolute top-3 left-3 z-[400] glass-panel-elevated px-3 py-1.5 rounded-xl text-[11px] text-slate-300 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
        <span>
          Radar active: {reminders.filter((r) => r.status === 'active' && r.latitude).length} geofences tracked
        </span>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        className="absolute bottom-4 left-4 z-[400] glass-panel-elevated p-2.5 rounded-2xl text-indigo-300 hover:text-white hover:bg-indigo-600/40 transition-all shadow-lg flex items-center space-x-1.5 text-xs font-semibold"
      >
        <Navigation className="w-4 h-4" />
        <span>Recenter</span>
      </button>
    </div>
  );
};
