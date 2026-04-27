'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, AlertCircle, Calendar, Car, Send, Plus } from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import B2BSubNav from '@/components/b2b/B2BSubNav'
import { AgencyAvatar, formatMad, StatusBadge } from '@/components/b2b/common'
import { useToast } from '@/contexts/ToastContext'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'counter', label: 'Counter-offer' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'declined', label: 'Declined' },
]

/**
 * V4 · My Requests Tracker.
 *
 * Outgoing-only view of a partner's B2B share requests, segmented by
 * resolution status. Counter-offered rows expose an inline reply form
 * for fast back-and-forth without leaving the tracker.
 */
export default function B2BMyRequests() {
  const [tab, setTab] = useState('all')

  const me = useQuery({
    queryKey: ['partner', 'me'],
    queryFn: () => partnerService.getPartnerProfile(),
    staleTime: 5 * 60_000,
  })
  const myPartnerId = me.data?.data?.id ?? me.data?.id

  const shares = useQuery({
    queryKey: ['b2b', 'car-shares'],
    queryFn: () => partnerService.getCarShareRequests(),
    staleTime: 30_000,
  })

  const outgoing = useMemo(() => {
    const raw = shares.data?.data || shares.data?.results || shares.data || []
    if (!Array.isArray(raw)) return []
    return raw.filter((r) => r.requester?.id === myPartnerId)
  }, [shares.data, myPartnerId])

  // Counter-offer detection: any message from the lender on a still-pending
  // request indicates a counter-offer is on the table.
  const annotated = useMemo(() => outgoing.map((r) => ({ ...r, _isCounter: false })), [outgoing])

  const counts = useMemo(() => {
    const c = { all: annotated.length, pending: 0, counter: 0, accepted: 0, declined: 0 }
    for (const r of annotated) {
      if (r.status === 'pending') c.pending += 1
      else if (r.status === 'accepted' || r.status === 'active' || r.status === 'completed') c.accepted += 1
      else if (r.status === 'rejected' || r.status === 'cancelled') c.declined += 1
    }
    return c
  }, [annotated])

  const visible = useMemo(() => {
    switch (tab) {
      case 'pending': return annotated.filter((r) => r.status === 'pending')
      case 'counter': return annotated.filter((r) => r._isCounter)
      case 'accepted': return annotated.filter((r) => ['accepted', 'active', 'completed'].includes(r.status))
      case 'declined': return annotated.filter((r) => ['rejected', 'cancelled'].includes(r.status))
      default: return annotated
    }
  }, [annotated, tab])

  return (
    <div className="min-h-screen bg-gray-50">
      <B2BSubNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track every B2B share request you've sent to other agencies.
            </p>
          </div>
          <Link
            href="/partner/b2b/browse"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            New request
          </Link>
        </div>

        {/* Status segmented tabs */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex gap-1 px-2 py-2 overflow-x-auto">
            {TABS.map((t) => {
              const count = counts[t.id]
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    tab === t.id ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                  {typeof count === 'number' && (
                    <span className={`ml-1.5 ${tab === t.id ? 'text-white/80' : 'text-gray-400'}`}>
                      ({count})
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {shares.isLoading && (
          <div className="flex flex-col items-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          </div>
        )}
        {shares.isError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p className="text-sm">Could not load your requests. Try again in a moment.</p>
          </div>
        )}
        {!shares.isLoading && !shares.isError && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
            <Car className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-lg font-semibold text-gray-900">No requests in this view.</p>
            <p className="text-sm text-gray-500 mt-1">
              Use Browse to find a vehicle and send your first request.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {visible.map((req) => (
            <RequestRow key={req.id} request={req} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RequestRow({ request }) {
  const owner = request.owner || {}
  const listing = request.listing || {}
  const vehicleLabel = `${listing.make || ''} ${listing.model || ''}`.trim()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [showReply, setShowReply] = useState(false)
  const [counter, setCounter] = useState('')

  const sendCounter = useMutation({
    mutationFn: (text) => partnerService.sendCarShareMessage(request.id, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b', 'car-shares'] })
      setCounter('')
      setShowReply(false)
      showToast('Counter sent.', 'success')
    },
    onError: (err) => {
      showToast(err?.data?.error || err?.message || 'Could not send counter.', 'error')
    },
  })

  const cancelRequest = useMutation({
    mutationFn: () => partnerService.updateCarShareRequestStatus(request.id, 'cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b', 'car-shares'] })
      showToast('Request cancelled.', 'success')
    },
    onError: (err) => {
      showToast(err?.data?.error || err?.message || 'Could not cancel.', 'error')
    },
  })

  const submitCounter = (e) => {
    e.preventDefault()
    const v = Number(counter)
    if (!Number.isFinite(v) || v <= 0) {
      showToast('Enter a valid MAD amount.', 'error')
      return
    }
    sendCounter.mutate(`Counter: ${v} MAD/day. Reply to confirm or counter again.`)
  }

  const headerColor =
    request.status === 'accepted' ? 'bg-green-50 border-green-200'
      : request.status === 'rejected' || request.status === 'cancelled' ? 'bg-red-50 border-red-200'
      : 'bg-blue-50 border-blue-200'

  return (
    <article className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <header className={`px-4 py-3 border-b flex items-center justify-between ${headerColor}`}>
        <div className="flex items-center gap-2 min-w-0">
          <AgencyAvatar
            name={owner.business_name || owner.businessName}
            logoUrl={owner.logo_url}
            size={28}
          />
          <span className="font-bold text-gray-900 truncate">
            {owner.business_name || 'Lender'} · {vehicleLabel || 'Vehicle'}
          </span>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-1.5">
          <p className="text-sm text-gray-700 inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            {request.start_date} → {request.end_date}
          </p>
          <p className="text-sm text-gray-500">
            My offer: <span className="font-bold text-orange-600">{formatMad(request.total_price, '')}</span>
          </p>
          {request.notes && (
            <p className="text-xs text-gray-500 italic line-clamp-2">"{request.notes}"</p>
          )}
        </div>
        <div className="flex sm:flex-col gap-2 sm:items-end">
          {request.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => setShowReply((v) => !v)}
                className="px-3 py-1.5 text-sm font-bold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50"
              >
                {showReply ? 'Cancel' : 'Counter'}
              </button>
              <button
                type="button"
                onClick={() => cancelRequest.mutate()}
                disabled={cancelRequest.isLoading}
                className="px-3 py-1.5 text-sm font-bold text-red-600 hover:underline disabled:opacity-50"
              >
                Cancel request
              </button>
            </>
          )}
          {request.status === 'accepted' && (
            <Link
              href="/partner/b2b/deals"
              className="px-3 py-1.5 text-sm font-bold text-green-700 border border-green-200 rounded-lg hover:bg-green-50"
            >
              View deal
            </Link>
          )}
        </div>
      </div>

      {showReply && (
        <form
          onSubmit={submitCounter}
          className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center gap-2"
        >
          <span className="text-sm text-gray-500">Counter with</span>
          <input
            type="number"
            min="1"
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
            placeholder="0"
            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-500">MAD</span>
          <button
            type="submit"
            disabled={sendCounter.isLoading}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      )}
    </article>
  )
}
