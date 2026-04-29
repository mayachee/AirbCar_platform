'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Loader2, AlertCircle, Car, Activity, Plus, MessageSquareText, MapPin,
} from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import { apiClient } from '@/lib/api/client'
import B2BSubNav from '@/components/b2b/B2BSubNav'

const FleetMap = dynamic(() => import('./FleetMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-stone-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      Drawing the network…
    </div>
  ),
})

/**
 * V5 · Network Fleet Map.
 *
 * A geographic portrait of the network — every agency, every city, every
 * car, in motion. The map sits at the centre. The activity rail to its
 * right reads like a newsroom: who joined, who listed, who's negotiating,
 * timestamps in plain language.
 */
export default function B2BFleetMap() {
  const [filter, setFilter] = useState('all') // all | available | b2b

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
    const raw =
      offers.data?.data?.data || offers.data?.data || offers.data?.results || []
    return Array.isArray(raw) ? raw : []
  }, [offers.data])

  const visibleListings = useMemo(() => {
    if (filter === 'available') return listings.filter((l) => l.is_available !== false)
    if (filter === 'b2b') return listings.filter((l) => l.is_b2b_enabled)
    return listings
  }, [listings, filter])

  const groupedPins = useMemo(() => {
    const map = new Map()
    for (const l of visibleListings) {
      const partner = l.partner || {}
      const partnerId = partner.id ?? l.partner_id ?? 'unknown'
      const partnerName =
        partner.business_name ||
        partner.businessName ||
        l.partner_name ||
        'Partner agency'
      const city = (l.location || '').split(',')[0].trim() || 'Unknown'
      const key = `${partnerId}|${city}`
      if (!map.has(key)) {
        map.set(key, { key, partnerId, partnerName, city, listings: [] })
      }
      map.get(key).listings.push(l)
    }
    return Array.from(map.values())
  }, [visibleListings])

  const stats = useMemo(() => {
    const cities = new Set(
      listings.map((l) => (l.location || '').split(',')[0].trim()).filter(Boolean),
    )
    const agencies = new Set(
      listings.map((l) => l.partner?.id ?? l.partner_id).filter(Boolean),
    )
    return {
      cars: listings.length,
      available: listings.filter((l) => l.is_available !== false).length,
      cities: cities.size,
      agencies: agencies.size,
    }
  }, [listings])

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <B2BSubNav />

      {/* Hero */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                Network Fleet Map
              </p>
              <h1 className="mt-3 text-4xl lg:text-5xl font-black tracking-tight text-stone-900 leading-[1.05]">
                Across the Moroccan north.{' '}
                <span className="italic font-light text-stone-500">Every fleet, mapped.</span>
              </h1>
              <p className="mt-4 text-base text-stone-600 leading-relaxed">
                One pin per agency, one colour per partner. Hover for the lineup. Watch the
                activity rail to read the network's pulse — new cars, new agencies, deals in
                motion.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Agencies' },
                { id: 'available', label: 'Available' },
                { id: 'b2b', label: 'B2B Discount' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    filter === f.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 border border-stone-300 hover:border-stone-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stat ribbon */}
          <dl className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 rounded-2xl overflow-hidden border border-stone-200">
            <Stat label="Cars on map" value={stats.cars} />
            <Stat label="Available now" value={stats.available} />
            <Stat label="Cities" value={stats.cities} icon={MapPin} />
            <Stat label="Agencies" value={stats.agencies} accent />
          </dl>
        </div>
      </section>

      {/* Map + Activity */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {offers.isError && (
          <div className="flex items-start gap-3 p-5 mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p className="text-sm">Could not load fleet data. Try again in a moment.</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[520px]">
          {/* Map */}
          <div className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden min-h-[460px]">
            {offers.isLoading ? (
              <div className="flex items-center justify-center h-full text-stone-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Drawing the network…
              </div>
            ) : (
              <FleetMap pins={groupedPins} />
            )}
          </div>

          {/* Activity rail */}
          <aside className="lg:w-80 bg-white rounded-3xl border border-stone-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">
            <header className="px-5 py-4 border-b border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600">
                The wire
              </p>
              <h2 className="mt-1 text-lg font-black text-stone-900 inline-flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Live activity
              </h2>
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
      </div>
    </div>
  )
}

/* ───────────────────── tiles + feed ───────────────────── */

function Stat({ label, value, suffix, accent, icon: Icon }) {
  return (
    <div className={`bg-white px-5 py-5 ${accent ? 'lg:bg-orange-50' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 inline-flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className="mt-2 text-3xl lg:text-4xl font-black text-stone-900">{value ?? '—'}</p>
      {suffix && <p className="text-[11px] text-stone-500 mt-1">{suffix}</p>}
    </div>
  )
}

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
          : 'New request'
        const dot =
          s.status === 'accepted' ? 'bg-emerald-500'
          : s.status === 'rejected' || s.status === 'cancelled' ? 'bg-stone-400'
          : s.status === 'active' ? 'bg-blue-500'
          : 'bg-orange-500'
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
            (l.partner?.business_name ||
              l.partner?.businessName ||
              l.partner_name ||
              'Agency') +
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
      .slice(0, 30)
  }, [shares, listings, partners])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400 p-6">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Reading the wire…
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-stone-400 p-6 text-center flex-1">
        <Car className="w-8 h-8 text-stone-300 mb-2" />
        <p className="text-sm">The network is quiet. Activity will appear here.</p>
      </div>
    )
  }

  return (
    <ul className="overflow-y-auto flex-1 divide-y divide-stone-100">
      {events.map((e) => {
        const Icon =
          e.kind === 'listing' ? Plus : e.kind === 'partner' ? Activity : MessageSquareText
        return (
          <li key={e.id} className="p-4 hover:bg-stone-50 transition-colors">
            <div className="flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${e.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-900 inline-flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-stone-400" />
                  {e.verb}
                </p>
                <p className="text-xs text-stone-500 mt-0.5 truncate">{e.line}</p>
                <p className="text-[11px] text-stone-400 mt-1">{timeAgo(e.when)}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function timeAgo(iso) {
  if (!iso) return 'recently'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  if (diff < 7 * 86_400_000) return `${Math.round(diff / 86_400_000)}d ago`
  return new Date(iso).toLocaleDateString()
}
