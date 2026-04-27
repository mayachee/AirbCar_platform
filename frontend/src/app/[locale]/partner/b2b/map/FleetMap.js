'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { lookupCityCoords, stringToColor } from '@/components/b2b/common'

const MOROCCO_CENTER = [31.7917, -7.0926]
const MOROCCO_ZOOM = 6

/**
 * Build a coloured circular pin with the agency initial. Colour is
 * deterministic per agency name so the legend stays consistent across pages.
 */
function buildAgencyIcon({ initial, color, count }) {
  const html = `
    <div style="
      transform: translate(-50%, -100%);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: white;
      border: 2px solid ${color};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 12px;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
    ">
      <span style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: ${color};
        color: white;
        border-radius: 50%;
        font-size: 10px;
      ">${initial}</span>
      <span>${count} car${count === 1 ? '' : 's'}</span>
    </div>
    <div style="
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 8px solid ${color};
      margin: 0 auto;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
    "></div>
  `
  return L.divIcon({ html, className: '', iconSize: [120, 36], iconAnchor: [60, 36] })
}

export default function FleetMap({ pins = [] }) {
  const enrichedPins = useMemo(() => {
    return pins
      .map((p) => {
        const coords = lookupCityCoords(p.city)
        if (!coords) return null
        // Stable jitter so multiple agencies in one city don't stack on top of each other.
        const seed = `${p.partnerId}-${p.city}`
        let h = 0
        for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
        const jitterLat = (((h % 200) - 100) / 100) * 0.02
        const jitterLng = ((((h >> 8) % 200) - 100) / 100) * 0.02
        return {
          ...p,
          coords: [coords[0] + jitterLat, coords[1] + jitterLng],
          color: stringToColor(p.partnerName || p.partnerId),
        }
      })
      .filter(Boolean)
  }, [pins])

  // Legend: unique agencies among visible pins.
  const legend = useMemo(() => {
    const seen = new Map()
    for (const p of enrichedPins) {
      if (!seen.has(p.partnerId)) {
        seen.set(p.partnerId, { name: p.partnerName, color: p.color })
      }
    }
    return Array.from(seen.values()).slice(0, 6)
  }, [enrichedPins])

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={MOROCCO_CENTER}
        zoom={MOROCCO_ZOOM}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {enrichedPins.map((p) => (
          <Marker
            key={p.key}
            position={p.coords}
            icon={buildAgencyIcon({
              initial: (p.partnerName || '?').charAt(0).toUpperCase(),
              color: p.color,
              count: p.listings.length,
            })}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-bold">{p.partnerName}</p>
                <p className="text-xs text-gray-500">{p.city} · {p.listings.length} vehicle{p.listings.length === 1 ? '' : 's'}</p>
                <ul className="mt-1 space-y-0.5">
                  {p.listings.slice(0, 5).map((l) => (
                    <li key={l.id} className="text-xs">
                      • {l.make} {l.model}{' '}
                      <span className="text-gray-500">
                        {l.b2b_price_per_day || l.price_per_day} MAD/day
                      </span>
                    </li>
                  ))}
                </ul>
                {p.listings.length > 5 && (
                  <p className="text-[11px] text-gray-400">+{p.listings.length - 5} more</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {legend.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-lg shadow-md border border-gray-200 p-2 z-[400] max-w-[220px]">
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Agencies</p>
          <ul className="space-y-1">
            {legend.map((l) => (
              <li key={l.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                <span className="truncate text-gray-700">{l.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
