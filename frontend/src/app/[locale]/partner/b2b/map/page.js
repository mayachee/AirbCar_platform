'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertCircle, Car, Activity } from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import B2BSubNav from '@/components/b2b/B2BSubNav'

// react-leaflet relies on browser globals — load only on the client.
const FleetMap = dynamic(() => import('./FleetMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-500">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      Loading map…
    </div>
  ),
})

/**
 * V5 · Fleet Map + Live Status.
 *
 * Geographic view of B2B-enabled inventory across the network. Pins are
 * grouped by partner (one colour per agency) with a live activity sidebar
 * fed by the partner's own car-share request stream — what's flowing in
 * and out of their fleet right now.
 */
export default function B2BFleetMap() {
  const [filter, setFilter] = useState('all') // all | available

  const offers = useQuery({
    queryKey: ['b2b', 'offers'],
    queryFn: () => partnerService.getB2BListings({}),
    staleTime: 60_000,
  })
  const shares = useQuery({
    queryKey: ['b2b', 'car-shares'],
    queryFn: () => partnerService.getCarShareRequests(),
    staleTime: 60_000,
  })

  const listings = useMemo(() => {
    const raw = offers.data?.data || offers.data?.results || offers.data || []
    return Array.isArray(raw) ? raw : []
  }, [offers.data])

  const visibleListings = useMemo(() => {
    if (filter === 'available') return listings.filter((l) => l.is_available !== false)
    return listings
  }, [listings, filter])

  // Pin clustering by partner: one pin per (partner, city) with a count.
  const groupedPins = useMemo(() => {
    const map = new Map()
    for (const l of visibleListings) {
      const partner = l.partner || {}
      const partnerId = partner.id ?? 'unknown'
      const partnerName = partner.business_name || partner.businessName || 'Partner agency'
      const city = (l.location || '').split(',')[0].trim() || 'Unknown'
      const key = `${partnerId}|${city}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          partnerId,
          partnerName,
          city,
          listings: [],
        })
      }
      map.get(key).listings.push(l)
    }
    return Array.from(map.values())
  }, [visibleListings])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <B2BSubNav />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Network Fleet Map</h1>
            <p className="text-sm text-gray-500 mt-1">
              See where every B2B-enabled vehicle in the network is right now.
            </p>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All Agencies' },
              { id: 'available', label: 'Available Only' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                  filter === f.id ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {offers.isError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p className="text-sm">Could not load fleet data. Try again in a moment.</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[500px]">
          {/* Map */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[420px]">
            {offers.isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading fleet…
              </div>
            ) : (
              <FleetMap pins={groupedPins} />
            )}
          </div>

          {/* Activity sidebar */}
          <aside className="lg:w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold text-gray-900">Live Activity</h2>
            </header>
            <ActivityFeed shares={shares.data} isLoading={shares.isLoading} />
          </aside>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Vehicles" value={listings.length} />
          <Stat
            label="Available"
            value={listings.filter((l) => l.is_available !== false).length}
          />
          <Stat label="Cities" value={new Set(listings.map((l) => (l.location || '').split(',')[0].trim()).filter(Boolean)).size} />
          <Stat label="Agencies" value={new Set(listings.map((l) => l.partner?.id).filter(Boolean)).size} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function ActivityFeed({ shares, isLoading }) {
  const events = useMemo(() => {
    const raw = shares?.data || shares?.results || shares || []
    if (!Array.isArray(raw)) return []
    // Sort newest first, keep last 20 events.
    return [...raw]
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 20)
  }, [shares])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-6">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading…
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 p-6 text-center flex-1">
        <Car className="w-8 h-8 text-gray-300 mb-2" />
        <p className="text-sm">No B2B activity yet. Activity from your share requests will appear here.</p>
      </div>
    )
  }

  return (
    <ul className="overflow-y-auto flex-1 divide-y divide-gray-100">
      {events.map((e) => {
        const requester = e.requester?.business_name || 'Agency'
        const owner = e.owner?.business_name || 'Agency'
        const carLabel = `${e.listing?.make || ''} ${e.listing?.model || ''}`.trim() || 'Vehicle'
        const dotColor =
          e.status === 'accepted' ? 'bg-green-500'
          : e.status === 'rejected' || e.status === 'cancelled' ? 'bg-red-500'
          : e.status === 'active' ? 'bg-blue-500'
          : 'bg-amber-500'
        const verb =
          e.status === 'accepted' ? 'Deal accepted'
          : e.status === 'rejected' ? 'Deal declined'
          : e.status === 'cancelled' ? 'Deal cancelled'
          : e.status === 'active' ? 'Share active'
          : e.status === 'completed' ? 'Share completed'
          : 'New request'
        return (
          <li key={e.id} className="p-4">
            <div className="flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full mt-1.5 ${dotColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{verb}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {requester} → {owner} · {carLabel}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(e.updated_at || e.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
