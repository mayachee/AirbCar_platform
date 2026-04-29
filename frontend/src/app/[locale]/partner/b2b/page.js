'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Filter, Loader2, AlertCircle, Plus, Car, MapPin, Sparkles, ArrowRight,
} from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import B2BSubNav from '@/components/b2b/B2BSubNav'
import { AgencyAvatar, formatMad, StatusBadge } from '@/components/b2b/common'

const TYPE_FILTERS = ['All', 'SUV', 'Sedan', 'Hatchback', 'Van', 'Coupe', 'Convertible', 'Truck']

/**
 * V1 · Inter-Agency Marketplace.
 *
 * The bulletin board for the Moroccan rental network — every available
 * car of every partner agency, surfaced at a glance. Designed to feel
 * less like a spreadsheet and more like the trade floor of a guild:
 * who has what, where, at what rate, right now.
 */
export default function B2BMarketplaceBoard() {
  const [tab, setTab] = useState('all')          // all | offering | requesting
  const [typeFilter, setTypeFilter] = useState('All')

  const offers = useQuery({
    queryKey: ['b2b', 'offers'],
    queryFn: () => partnerService.getB2BListings({}),
    staleTime: 60_000,
  })
  const myCarShares = useQuery({
    queryKey: ['b2b', 'car-shares'],
    queryFn: () => partnerService.getCarShareRequests(),
    staleTime: 60_000,
  })

  const offerRows = useMemo(() => {
    const raw = offers.data?.data?.data || offers.data?.data || offers.data?.results || []
    return Array.isArray(raw) ? raw : []
  }, [offers.data])

  const requestRows = useMemo(() => {
    const raw = myCarShares.data?.data || myCarShares.data?.results || myCarShares.data || []
    if (!Array.isArray(raw)) return []
    return raw.filter((r) => r.status === 'pending')
  }, [myCarShares.data])

  const filteredOffers = useMemo(() => {
    if (typeFilter === 'All') return offerRows
    return offerRows.filter(
      (o) => (o.vehicle_style || o.style || '').toLowerCase() === typeFilter.toLowerCase(),
    )
  }, [offerRows, typeFilter])

  const showOffers = tab === 'all' || tab === 'offering'
  const showRequests = tab === 'all' || tab === 'requesting'

  // Network metrics for the hero strip
  const stats = useMemo(() => {
    const cities = new Set(
      offerRows.map((l) => (l.location || '').split(',')[0].trim()).filter(Boolean),
    )
    const agencies = new Set(
      offerRows.map((l) => l.partner?.id ?? l.partner_id).filter(Boolean),
    )
    const discounted = offerRows.filter((l) => l.is_b2b_enabled).length
    return {
      cars: offerRows.length,
      agencies: agencies.size,
      cities: cities.size,
      discounted,
    }
  }, [offerRows])

  const isLoading = offers.isLoading
  const hasError = offers.isError
  const noResults =
    !isLoading &&
    !hasError &&
    (!showOffers || filteredOffers.length === 0) &&
    (!showRequests || requestRows.length === 0)

  return (
    <div className="min-h-screen bg-stone-50">
      <B2BSubNav />

      {/* Hero — the network state in one breath */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                The Inter-Agency Marketplace
              </p>
              <h1 className="mt-3 text-4xl lg:text-5xl font-black tracking-tight text-stone-900 leading-[1.05]">
                Every car. Every agency.{' '}
                <span className="italic font-light text-stone-500">One trusted network.</span>
              </h1>
              <p className="mt-4 text-base text-stone-600 leading-relaxed">
                When a customer needs a vehicle you don't have on hand, your fellow agencies do.
                Browse the rolling fleet across the Moroccan north and pitch a price for the
                booking that just walked into your storefront.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/partner/b2b/browse"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-bold rounded-full hover:bg-stone-800 transition-colors"
              >
                Send a request
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/partner/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-300 text-stone-700 text-sm font-bold rounded-full hover:border-stone-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                List a vehicle
              </Link>
            </div>
          </div>

          {/* Stat ribbon */}
          <dl className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 rounded-2xl overflow-hidden border border-stone-200">
            <Stat label="Cars in network" value={stats.cars} suffix={isLoading ? null : 'available'} />
            <Stat label="Agencies" value={stats.agencies} suffix="trading today" />
            <Stat label="Cities" value={stats.cities} suffix="across Morocco" />
            <Stat label="B2B Discount" value={stats.discounted} suffix="opted-in rates" accent />
          </dl>
        </div>
      </section>

      {/* Filters + tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-1 bg-white rounded-full border border-stone-200 p-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'offering', label: 'Offering' },
              { id: 'requesting', label: 'Requesting' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                  tab === t.id
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-stone-400 shrink-0" />
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-full transition-colors border ${
                  typeFilter === t
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
            <p className="text-sm">Reading the network…</p>
          </div>
        )}
        {hasError && (
          <div className="flex items-start gap-3 p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">Could not load the marketplace.</p>
              <p className="text-sm">Try again in a moment, or check that you have a partner profile.</p>
            </div>
          </div>
        )}
        {noResults && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-stone-300 text-center px-6">
            <Sparkles className="w-10 h-10 mb-3 text-stone-300" />
            <p className="text-lg font-semibold text-stone-900">The trade floor is quiet.</p>
            <p className="text-sm text-stone-500 mt-1 max-w-md">
              Try a different tab or remove filters. Once partners list cars or send requests,
              they'll show up here in real time.
            </p>
          </div>
        )}

        {/* Cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {showOffers && filteredOffers.map((listing) => (
            <OfferCard key={`offer-${listing.id}`} listing={listing} />
          ))}
          {showRequests && requestRows.map((req) => (
            <RequestCard key={`req-${req.id}`} request={req} />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

/* ───────────────────── Stat tile ───────────────────── */

function Stat({ label, value, suffix, accent }) {
  return (
    <div className={`bg-white px-5 py-5 ${accent ? 'lg:bg-orange-50' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500">{label}</p>
      <p className="mt-2 text-3xl lg:text-4xl font-black text-stone-900">
        {value ?? '—'}
      </p>
      {suffix && <p className="text-[11px] text-stone-500 mt-1">{suffix}</p>}
    </div>
  )
}

/* ───────────────────── Offer card ───────────────────── */

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

function OfferCard({ listing }) {
  const partner = listing.partner || {}
  const partnerName =
    partner.business_name ||
    partner.businessName ||
    listing.partner_name ||
    'Partner agency'
  const partnerLogo = partner.logo_url || listing.partner_logo
  const vehicleName = `${listing.make || ''} ${listing.model || ''}`.trim()
  const year = listing.year
  const price = listing.b2b_price_per_day ?? listing.b2b_price ?? listing.price_per_day
  const retail = listing.price_per_day
  const hasDiscount =
    listing.is_b2b_enabled &&
    Number(listing.b2b_price_per_day ?? 0) > 0 &&
    Number(listing.b2b_price_per_day) < Number(retail || 0)
  const image =
    listing.images?.[0]?.url ||
    listing.images?.[0]?.image ||
    (typeof listing.images?.[0] === 'string' ? listing.images[0] : null)
  const city = (listing.location || '').split(',')[0].trim() || null

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-3xl border border-stone-200 overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] transition-shadow"
    >
      <div className="relative h-48 bg-stone-100 overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={vehicleName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <Car className="w-14 h-14" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur text-stone-700 shadow-sm">
            Offer
          </span>
          {hasDiscount && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white shadow-sm">
              <Sparkles className="w-3 h-3" />
              B2B rate
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Agency lede */}
        <div className="flex items-center gap-2.5">
          <AgencyAvatar name={partnerName} logoUrl={partnerLogo} size={32} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{partnerName}</p>
            <p className="text-[11px] text-stone-500 inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {city || 'Location not set'}
            </p>
          </div>
        </div>

        {/* Vehicle as the beat */}
        <div className="border-t border-stone-100 pt-3">
          <p className="text-lg font-black text-stone-900 leading-tight">{vehicleName || 'Vehicle'}</p>
          <p className="text-xs text-stone-500 mt-0.5 capitalize">
            {[
              year,
              listing.vehicle_style || listing.style,
              listing.fuel_type || listing.fuelType,
              listing.transmission,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-stone-100">
          <div>
            <p className="text-[10px] text-stone-500 uppercase tracking-wider">
              {hasDiscount ? 'B2B rate' : 'Daily rate'}
            </p>
            <p className="text-xl font-black text-stone-900">{formatMad(price, '')}</p>
            {hasDiscount && (
              <p className="text-[11px] text-stone-400 line-through">{formatMad(retail, '')}</p>
            )}
          </div>
          <Link
            href={`/partner/b2b/${listing.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-stone-900 rounded-full hover:bg-stone-700 transition-colors"
          >
            Request
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

/* ───────────────────── Request card ───────────────────── */

function RequestCard({ request }) {
  const requester = request.requester || {}
  const owner = request.owner || {}
  const listing = request.listing || {}
  const vehicleLabel = `${listing.make || ''} ${listing.model || ''}`.trim()

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border-2 border-blue-200 overflow-hidden flex flex-col"
    >
      <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center justify-between">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white">
          Request
        </span>
        <StatusBadge status={request.status} />
      </div>
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <AgencyAvatar
            name={requester.business_name || requester.businessName}
            logoUrl={requester.logo_url}
            size={32}
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">
              {requester.business_name || requester.businessName || 'Partner agency'}
            </p>
            <p className="text-[11px] text-stone-500">
              wants to borrow from {owner.business_name || 'you'}
            </p>
          </div>
        </div>
        <div className="border-t border-stone-100 pt-3">
          <p className="text-lg font-black text-stone-900 leading-tight">{vehicleLabel || 'Vehicle'}</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {request.start_date} → {request.end_date}
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-stone-100">
          <div>
            <p className="text-[10px] text-stone-500 uppercase tracking-wider">Proposed</p>
            <p className="text-xl font-black text-blue-700">{formatMad(request.total_price, '')}</p>
          </div>
          <Link
            href="/partner/b2b/deals"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-blue-700 rounded-full hover:bg-blue-800 transition-colors"
          >
            Negotiate
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
