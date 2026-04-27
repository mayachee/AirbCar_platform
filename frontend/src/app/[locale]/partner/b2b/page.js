'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Filter, Loader2, AlertCircle, Plus, Car, MapPin, Calendar } from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import B2BSubNav from '@/components/b2b/B2BSubNav'
import { AgencyAvatar, formatMad, StatusBadge } from '@/components/b2b/common'

const TYPE_FILTERS = ['All Types', 'SUV', 'Sedan', 'Hatchback', 'Van', 'Coupe', 'Convertible', 'Truck']

/**
 * V1 · Marketplace Board.
 *
 * Bulletin-board view of B2B inventory: OFFER cards from network agencies
 * + REQUEST cards reflecting the partner's own incoming share requests.
 * Tabs let the partner narrow to one side.
 */
export default function B2BMarketplaceBoard() {
  const [tab, setTab] = useState('all') // all | offering | requesting
  const [typeFilter, setTypeFilter] = useState('All Types')

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
    const raw = offers.data?.data || offers.data?.results || offers.data || []
    return Array.isArray(raw) ? raw : []
  }, [offers.data])

  const requestRows = useMemo(() => {
    const raw = myCarShares.data?.data || myCarShares.data?.results || myCarShares.data || []
    if (!Array.isArray(raw)) return []
    // Only show pending incoming requests (other agencies asking *me* to lend)
    // and pending outgoing (me asking others) — those are the open conversations.
    return raw.filter((r) => r.status === 'pending')
  }, [myCarShares.data])

  const filteredOffers = useMemo(() => {
    if (typeFilter === 'All Types') return offerRows
    return offerRows.filter(
      (o) => (o.vehicle_style || o.style || '').toLowerCase() === typeFilter.toLowerCase()
    )
  }, [offerRows, typeFilter])

  const showOffers = tab === 'all' || tab === 'offering'
  const showRequests = tab === 'all' || tab === 'requesting'

  const isLoading = offers.isLoading || myCarShares.isLoading
  const hasError = offers.isError || myCarShares.isError
  const noResults =
    !isLoading &&
    !hasError &&
    (!showOffers || filteredOffers.length === 0) &&
    (!showRequests || requestRows.length === 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <B2BSubNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inter-Agency Marketplace</h1>
            <p className="text-sm text-gray-500 mt-1">
              Browse vehicles offered by trusted partner agencies and respond to their requests.
            </p>
          </div>
          <Link
            href="/partner/b2b/browse"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            List a vehicle
          </Link>
        </div>

        {/* Tab strip + filter pills */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
            <div className="flex gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'offering', label: 'Offering' },
                { id: 'requesting', label: 'Requesting' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    tab === t.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                    typeFilter === t
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* States */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
            <p>Loading marketplace…</p>
          </div>
        )}
        {hasError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">Could not load the marketplace.</p>
              <p className="text-sm">Try again in a moment, or check that you have a partner profile.</p>
            </div>
          </div>
        )}
        {noResults && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
            <Car className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-lg font-semibold text-gray-900">Nothing posted in this view yet.</p>
            <p className="text-sm text-gray-500 mt-1">Try a different tab or remove filters.</p>
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showOffers && filteredOffers.map((listing) => (
            <OfferCard key={`offer-${listing.id}`} listing={listing} />
          ))}
          {showRequests && requestRows.map((req) => (
            <RequestCard key={`req-${req.id}`} request={req} />
          ))}
        </div>
      </div>
    </div>
  )
}

function OfferCard({ listing }) {
  const partner = listing.partner || {}
  const vehicleLabel = `${listing.make || ''} ${listing.model || ''} ${listing.year || ''}`.trim()
  const price = listing.b2b_price_per_day ?? listing.b2b_price ?? listing.price_per_day
  const image =
    listing.images?.[0]?.url ||
    listing.images?.[0]?.image ||
    (typeof listing.images?.[0] === 'string' ? listing.images[0] : null)

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
    >
      <div className="relative h-44 bg-gray-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={vehicleLabel} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Car className="w-12 h-12" />
          </div>
        )}
        <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-500 text-white shadow-sm">
          Offer
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AgencyAvatar
            name={partner.business_name || partner.businessName}
            logoUrl={partner.logo_url}
            size={28}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {partner.business_name || partner.businessName || 'Partner agency'}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.location || 'Location not set'}
            </p>
          </div>
        </div>

        <div>
          <p className="font-bold text-gray-900 truncate">{vehicleLabel || 'Vehicle'}</p>
          <p className="text-xs text-gray-500 capitalize">
            {[listing.vehicle_style || listing.style, listing.fuel_type || listing.fuelType, listing.transmission]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">B2B rate</p>
            <p className="text-lg font-black text-orange-600">{formatMad(price)}</p>
          </div>
          <Link
            href={`/partner/b2b/${listing.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50"
          >
            Request
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function RequestCard({ request }) {
  const requester = request.requester || {}
  const owner = request.owner || {}
  const listing = request.listing || {}
  const vehicleLabel = `${listing.make || ''} ${listing.model || ''}`.trim()
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden flex flex-col"
    >
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500 text-white shadow-sm">
          Request
        </span>
        <StatusBadge status={request.status} />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AgencyAvatar
            name={requester.business_name || requester.businessName}
            logoUrl={requester.logo_url}
            size={28}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {requester.business_name || requester.businessName || 'Partner agency'}
            </p>
            <p className="text-xs text-gray-500">wants to borrow from {owner.business_name || 'you'}</p>
          </div>
        </div>

        <div>
          <p className="font-bold text-gray-900 truncate">{vehicleLabel || 'Vehicle'}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {request.start_date} → {request.end_date}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Proposed</p>
            <p className="text-lg font-black text-blue-600">{formatMad(request.total_price, '')}</p>
          </div>
          <Link
            href="/partner/b2b/deals"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            Negotiate
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
