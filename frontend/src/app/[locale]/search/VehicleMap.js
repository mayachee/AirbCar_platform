'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MOROCCAN_CITY_COORDS,
  MOROCCO_CENTER,
  MOROCCO_DEFAULT_ZOOM,
} from '@/constants';

function getCityCoords(city) {
  if (!city) return null;
  const key = Object.keys(MOROCCAN_CITY_COORDS).find(
    (k) => k.toLowerCase() === String(city).toLowerCase()
  );
  return key ? MOROCCAN_CITY_COORDS[key] : null;
}

function getCarCoords(car, index = 0) {
  if (car?.latitude != null && car?.longitude != null) {
    return [Number(car.latitude), Number(car.longitude)];
  }
  const cityCoords = getCityCoords(car?.location);
  if (!cityCoords) return null;
  // Deterministic jitter so markers in the same city don't stack on top of each other
  const id = String(car?.id ?? index);
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
  const jitterLat = (((h % 200) - 100) / 100) * 0.02; // ±0.02°  ≈ ±2 km
  const jitterLng = ((((h >> 8) % 200) - 100) / 100) * 0.02;
  return [cityCoords[0] + jitterLat, cityCoords[1] + jitterLng];
}

function buildPriceIcon({ price, active }) {
  const bg = active ? 'var(--text-primary)' : 'var(--surface-container-lowest)';
  const color = active ? 'white' : 'var(--text-primary)';
  const scale = active ? 1.1 : 1;
  const html = `
    <div style="
      transform: translate(-50%, -100%) scale(${scale});
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      background: ${bg};
      color: ${color};
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      border: 1px solid var(--border-subtle);
      position: relative;
      transition: transform 120ms ease;
    ">
      ${price}
      <span style="
        position: absolute;
        bottom: -3px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 8px; height: 8px;
        background: ${bg};
        border-right: 1px solid var(--border-subtle);
        border-bottom: 1px solid var(--border-subtle);
      "></span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'vehicle-price-pin',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapViewSync({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !center) return;
    map.setView(center, zoom, { animate: true });
  }, [map, center?.[0], center?.[1], zoom]);
  return null;
}

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    if (!map) return undefined;
    const container = map.getContainer();
    const invalidate = () => map.invalidateSize();
    // Fire once after mount so flex containers get measured correctly
    const t = setTimeout(invalidate, 50);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidate) : null;
    if (observer && container) observer.observe(container);
    return () => {
      clearTimeout(t);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

function FitBoundsOnResults({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !markers || markers.length === 0) return;
    if (markers.length === 1) {
      map.setView(markers[0], 12, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(markers);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [map, markers]);
  return null;
}

export default function VehicleMap({
  cars = [],
  locationFilter = '',
  hoveredCarId = null,
  selectedCarId = null,
  onMarkerHover,
  onMarkerLeave,
  onMarkerClick,
  formatPrice,
}) {
  const markers = useMemo(
    () =>
      cars
        .map((car, i) => {
          const coords = getCarCoords(car, i);
          return coords ? { car, coords } : null;
        })
        .filter(Boolean),
    [cars]
  );

  const centerFromLocation = getCityCoords(locationFilter);
  const initialCenter = centerFromLocation || MOROCCO_CENTER;
  const initialZoom = centerFromLocation ? 11 : MOROCCO_DEFAULT_ZOOM;

  const markerPositions = useMemo(() => markers.map((m) => m.coords), [markers]);

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom
      className="absolute inset-0 z-0"
      style={{ background: 'var(--surface-1)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <InvalidateOnResize />

      {centerFromLocation ? (
        <MapViewSync center={centerFromLocation} zoom={11} />
      ) : (
        <FitBoundsOnResults markers={markerPositions} />
      )}

      {markers.map(({ car, coords }) => {
        const active = hoveredCarId === car.id || selectedCarId === car.id;
        const priceText = formatPrice ? formatPrice(car.price_per_day) : String(car.price_per_day);
        return (
          <Marker
            key={car.id}
            position={coords}
            icon={buildPriceIcon({ price: priceText, active })}
            eventHandlers={{
              mouseover: () => onMarkerHover?.(car.id),
              mouseout: () => onMarkerLeave?.(car.id),
              click: () => onMarkerClick?.(car.id),
            }}
            zIndexOffset={active ? 1000 : 0}
          />
        );
      })}
    </MapContainer>
  );
}
