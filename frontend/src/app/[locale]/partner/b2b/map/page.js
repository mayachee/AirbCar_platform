'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertCircle, Car, Activity, Plus, MessageSquareText } from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import { apiClient } from '@/lib/api/client'
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
 * Geographic view of every available vehicle on the network. Pins are
 * grouped per (agency, city) — one coloured marker per agency-location
 * pair, popup lists the cars there. The Live Activity rail merges three
 * streams so the page feels alive even when no B2B requests are in flight:
 *   - new car-share requests / status changes (own + counterparties)
 *   - new vehicles added to the network (any agency)
 *   - new agencies onboarding (any partner)
 */
export default function B2BFleetMap() {
  const [filter, setFilter] = useState('all') // all | available | b2b

  // Whole network inventory (the V1/V3 endpoint returns every available
  // car of other partners by default).
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
  // Pull the most recently created listings + partners for the activity feed.
  // /listings/ is public — no auth needed and includes every agency.
  const recentListings = useQuery({
    queryKey: ['b2b', 'recent-listings'],
    queryFn: () => apiClient.get('/listings/?page=1&page_size=15'),
    staleTime: 60_000,
  })
  const recentPartners = useQuery({
    queryKey: ['b2b', 'recent-partners'],
    queryFn: () => apiClient.get('/partners/?page=1&page_size=10'),
    staleTime: 60_000,
  })

  const listings = useMemo(() => {
    const raw = offers.data?.data || offers.data?.results || offers.data || []
    return Array.isArray(raw) ? raw : []
  }, [offers.data])

  const visibleListings = useMemo(() => {
    if (filter === 'available') return listings.filter((l) => l.is_available !== false)
    if (filter === 'b2b') return listings.filter((l) => l.is_b2b_enabled)
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
              Every agency and every available vehicle in the network — live.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Agencies' },
              { id: 'available', label: 'Available Only' },
              { id: 'b2b', label: 'B2B Discount Only' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                  filter === f.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
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
            <ActivityFeed
              shares={shares.data}
              listings={recentListings.data}
              partners={recentPartners.data}
              isLoading={
                shares.isLoading || recentListings.isLoading || recentPartners.isLoading
              }
            />
          </aside>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Vehicles" value={listings.length} />
          <Stat
            label="Available"
            value={listings.filter((l) => l.is_available !== false).length}
          />
          <Stat
            label="Cities"
            value={
              new Set(
                listings.map((l) => (l.location || '').split(',')[0].trim()).filter(Boolean),
              ).size
            }
          />
          <Stat
            label="Agencies"
            value={new Set(listings.map((l) => l.partner?.id).filter(Boolean)).size}
          />
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

/**
 * Merges three streams (car-shares, recent listings, recent partners) into
 * a single time-sorted activity rail. Each item carries a `kind` so we can
 * pick a colour + icon + verb without three separate render branches.
 */
function ActivityFeed({ shares, listings, partners, isLoading }) {
  const events = useMemo(() => {
    const out = []

    const sharesRaw = shares?.data || shares?.results || shares || []
    if (Array.isArray(sharesRaw)) {
      for (const s of sharesRaw) {
        const verb =
          s.status === 'accepted' ? 'Deal accepted'
          : s.status === 'rejected' ? 'Deal declined'
          : s.status === 'cancelled' ? 'Deal cancelled'
          : s.status === 'active' ? 'Share active'
          : s.status === 'completed' ? 'Share completed'
          : 'Share request'
        const dot =
          s.status === 'accepted' ? 'bg-green-500'
          : s.status === 'rejected' || s.status === 'cancelled' ? 'bg-red-500'
          : s.status === 'active' ? 'bg-blue-500'
          : 'bg-amber-500'
        out.push({
          id: `share-${s.id}`,
          when: s.updated_at || s.created_at,
          kind: 'share',
          verb,
          dot,
          line:
            (s.requester?.business_name || 'Agency') +
            ' → ' +
            (s.owner?.business_name || 'Agency') +
            ' · ' +
            ((s.listing?.make || '') + ' ' + (s.listing?.model || '')).trim(),
        })
      }
    }

    const listingsRaw = listings?.data?.data || listings?.data || listings?.results || []
    if (Array.isArray(listingsRaw)) {
      for (const l of listingsRaw) {
        out.push({
          id: `listing-${l.id}`,
          when: l.created_at,
          kind: 'listing',
          verb: 'New vehicle',
          dot: 'bg-emerald-500',
          line:
            (l.partner?.business_name || l.partner?.businessName || 'Agency') +
            ' added ' +
            ((l.make || '') + ' ' + (l.model || '')).trim(),
        })
      }
    }

    const partnersRaw = partners?.data?.data || partners?.data || partners?.results || []
    if (Array.isArray(partnersRaw)) {
      for (const p of partnersRaw) {
        out.push({
          id: `partner-${p.id}`,
          when: p.created_at,
          kind: 'partner',
          verb: 'New agency',
          dot: 'bg-violet-500',
          line: (p.business_name || p.businessName || 'Agency') + ' joined the network',
        })
      }
    }

    return out
      .filter((e) => e.when)
      .sort((a, b) => new Date(b.when) - new Date(a.when))
      .slice(0, 25)
  }, [shares, listings, partners])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-6">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading activity…
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 p-6 text-center flex-1">
        <Car className="w-8 h-8 text-gray-300 mb-2" />
        <p className="text-sm">Nothing happening on the network yet. Activity will appear here.</p>
      </div>
    )
  }

  return (
    <ul className="overflow-y-auto flex-1 divide-y divide-gray-100">
      {events.map((e) => {
        const Icon =
          e.kind === 'listing' ? Plus : e.kind === 'partner' ? Activity : MessageSquareText
        return (
          <li key={e.id} className="p-4">
            <div className="flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full mt-1.5 ${e.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 inline-flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  {e.verb}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{e.line}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(e.when).toLocaleString()}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
