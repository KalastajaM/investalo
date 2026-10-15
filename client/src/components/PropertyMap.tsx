import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  popup?: string;
  id?: number;
}

interface PropertyMapProps {
  markers: MapMarker[];
  height?: string;
  zoom?: number;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [60.1699, 24.9384];

export function PropertyMap({ markers, height = "300px", zoom, className = "" }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [, navigate] = useLocation();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const validMarkers = markers.filter(m => !isNaN(m.lat) && !isNaN(m.lng));
    const center: [number, number] = validMarkers.length > 0
      ? [validMarkers[0].lat, validMarkers[0].lng]
      : DEFAULT_CENTER;

    const defaultZoom = validMarkers.length === 1 ? 14 : validMarkers.length > 1 ? 12 : 10;

    const map = L.map(mapRef.current).setView(center, zoom ?? defaultZoom);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "custom-marker",
      html: `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });

    validMarkers.forEach(m => {
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      const baseContent = m.popup || `<strong>${m.label}</strong>`;
      const popupContent = m.id
        ? `${baseContent}<br/><a data-href="/property/${m.id}" href="#" style="color:#3b82f6;text-decoration:underline;cursor:pointer;font-size:12px;">View Analysis →</a>`
        : baseContent;
      marker.bindPopup(popupContent);
      if (m.id) {
        marker.on("popupopen", (e) => {
          const link = e.popup.getElement()?.querySelector("[data-href]") as HTMLElement | null;
          if (link) {
            link.addEventListener("click", (ev) => {
              ev.preventDefault();
              navigateRef.current(link.dataset.href!);
            });
          }
        });
      }
    });

    if (validMarkers.length > 1) {
      const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers, zoom]);

  if (markers.filter(m => !isNaN(m.lat) && !isNaN(m.lng)).length === 0) {
    return null;
  }

  return (
    <div
      ref={mapRef}
      className={`rounded-lg border ${className}`}
      style={{ height, width: "100%", isolation: "isolate" }}
      data-testid="property-map"
    />
  );
}
