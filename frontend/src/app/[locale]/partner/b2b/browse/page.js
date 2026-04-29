'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Search, Calendar, Car, Users, Fuel, MapPin, Send } from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import B2BSubNav from '@/components/b2b/B2BSubNav'
import { AgencyAvatar, formatMad } from '@/components/b2b/common'
import { useToast } from '@/contexts/ToastContext'

const TYPE_PILLS = ['All Types', 'sedan', 'suv', 'hatchback', 'van', 'truck', 'coupe', 'convertible']

/**
 * V3 · Browse & Request (Borrower).
 *
 * Borrower's search view. Search by city, filter by vehicle style, and
 * fire off a B2B share request inline. Differs from V1 in that:
 *  - it only shows OFFERS (no incoming-request bulletin),
 *  - the request modal is opened in-context instead of routing to the listing detail.
 */
export default function B2BBrowsePage() {
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [pill, setPill] = useState('All Types')
  const [requestModal, setRequestModal] = useState(null) // { listing }

  const offers = useQuery({
    queryKey: ['b2b', 'browse', search, city],
    queryFn: () => partnerService.getB2BListings({ search: search || undefined, location: city || undefined }),
    staleTime: 30_000,
  })

  const rows = useMemo(() => {
    // /listings/ wraps responses at three levels: apiClient -> backend
    // envelope -> array of listings. Older endpoints return at two levels.
    const raw =
      offers.data?.data?.data ||
      offers.data?.data ||
      offers.data?.results ||
      []
    if (!Array.isArray(raw)) return []
    return pill === 'All Types'
      ? raw
      : raw.filter((o) => (o.vehicle_style || o.style || '').toLowerCase() === pill.toLowerCase())
  }, [offers.data, pill])

  return (
    <div className="min-h-screen bg-gray-50">
      <B2BSubNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Find a vehicle</h1>
            <p className="text-sm text-gray-500 mt-1">
              Search vehicles offered by partner agencies. Send a request with your offer price.
            </p>
          </div>
          <Link
            href="/partner/b2b/requests"
            className="text-sm font-bold text-orange-600 hover:text-orange-700 underline-offset-4 hover:underline"
          >
            View my requests →
          </Link>
        </div>

        {/* Search bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); offers.refetch() }}
          className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap gap-2 items-center shadow-sm"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Make, model, agency…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-40 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600"
          >
            Search
          </button>
        </form>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPE_PILLS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPill(p)}
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border capitalize transition-colors ${
                pill === p
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500">
          {offers.isLoading ? 'Searching…' : `${rows.length} vehicle${rows.length === 1 ? '' : 's'} available from partner agencies`}
        </p>

        {offers.isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          </div>
        )}
        {offers.isError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p className="text-sm">Could not load search results. Try again in a moment.</p>
          </div>
        )}
        {!offers.isLoading && !offers.isError && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
            <Car className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-lg font-semibold text-gray-900">No vehicles match.</p>
            <p className="text-sm text-gray-500 mt-1">Try clearing the city or type filter.</p>
          </div>
        )}

        {/* Results list */}
        <div className="space-y-3">
          {rows.map((listing) => (
            <BrowseRow key={listing.id} listing={listing} onRequest={() => setRequestModal({ listing })} />
          ))}
        </div>
      </div>

      {requestModal && (
        <RequestModal
          listing={requestModal.listing}
          onClose={() => setRequestModal(null)}
          onSubmitted={() => {
            setRequestModal(null)
            showToast('Request sent. Track it in My Requests.', 'success')
          }}
        />
      )}
    </div>
  )
}

function BrowseRow({ listing, onRequest }) {
  const partner = listing.partner || {}
  // /listings/ list endpoint flattens partner; B2B detail endpoint nests it.
  const partnerName =
    partner.business_name ||
    partner.businessName ||
    listing.partner_name ||
    'Partner agency'
  const partnerLogo = partner.logo_url || listing.partner_logo
  const vehicleLabel = `${listing.make || ''} ${listing.model || ''} ${listing.year || ''}`.trim()
  const price = listing.b2b_price_per_day ?? listing.b2b_price ?? listing.price_per_day
  const image =
    listing.images?.[0]?.url ||
    listing.images?.[0]?.image ||
    (typeof listing.images?.[0] === 'string' ? listing.images[0] : null)

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4"
    >
      <div className="w-full sm:w-40 h-32 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={vehicleLabel} className="w-full h-full object-cover" />
        ) : (
          <Car className="w-8 h-8 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AgencyAvatar name={partnerName} logoUrl={partnerLogo} size={24} />
          <p className="text-sm font-semibold text-gray-900 truncate">{partnerName}</p>
          <span className="text-xs text-gray-400">·</span>
          <p className="text-xs text-gray-500 inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.location || '—'}
          </p>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Available
          </span>
        </div>
        <div>
          <p className="font-bold text-gray-900 truncate">{vehicleLabel || 'Vehicle'}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {listing.seating_capacity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-md">
                <Users className="w-3 h-3" /> {listing.seating_capacity} seats
              </span>
            )}
            {(listing.fuel_type || listing.fuelType) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-md capitalize">
                <Fuel className="w-3 h-3" /> {listing.fuel_type || listing.fuelType}
              </span>
            )}
            {listing.transmission && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-md capitalize">
                {listing.transmission}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex sm:flex-col sm:items-end items-center justify-between gap-3 sm:justify-center sm:w-32">
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">B2B rate</p>
          <p className="text-xl font-black text-orange-600">{formatMad(price, '')}</p>
          <p className="text-xs text-gray-500">per day</p>
        </div>
        <button
          type="button"
          onClick={onRequest}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600"
        >
          <Send className="w-4 h-4" />
          Request
        </button>
      </div>
    </motion.div>
  )
}

function RequestModal({ listing, onClose, onSubmitted }) {
  const { showToast } = useToast()
  const partner = listing.partner || {}
  const today = new Date().toISOString().slice(0, 10)
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [price, setPrice] = useState(listing.b2b_price_per_day ?? listing.b2b_price ?? listing.price_per_day ?? '')
  const [notes, setNotes] = useState('')

  const create = useMutation({
    mutationFn: (data) => partnerService.createCarShareRequest(data),
    onSuccess: () => onSubmitted?.(),
    onError: (err) => {
      showToast(err?.data?.error || err?.message || 'Could not send request.', 'error')
    },
  })

  const submit = (e) => {
    e.preventDefault()
    if (!listing.public_id) {
      showToast('This listing is missing a public ID — ask the agency to publish it.', 'error')
      return
    }
    if (!start || !end || end < start) {
      showToast('Pick a valid date range.', 'error')
      return
    }
    const numericPrice = Number(price)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      showToast('Enter a valid MAD price.', 'error')
      return
    }
    create.mutate({
      public_id: listing.public_id,
      start_date: start,
      end_date: end,
      total_price: numericPrice,
      notes: notes || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900">Request to borrow</h2>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {listing.make} {listing.model} {listing.year} from {partner.business_name || 'Partner agency'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Start</span>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">End</span>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Your offer (MAD/day)</span>
            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Notes (optional)</span>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pickup time, intended use, etc."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              maxLength={500}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {create.isLoading ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
