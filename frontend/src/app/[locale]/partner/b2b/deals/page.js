'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2, AlertCircle, Calendar, Car, FileText, ArrowRight, ArrowLeft, Send,
} from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import B2BSubNav from '@/components/b2b/B2BSubNav'
import { AgencyAvatar, formatMad, StatusBadge } from '@/components/b2b/common'
import { useToast } from '@/contexts/ToastContext'

/**
 * V2 · Negotiation Flow.
 *
 * Active deal pipeline. Each card shows the price-history thread (parsed
 * from the chat messages exchanged on this CarShareRequest), an inline
 * counter-offer input, and Accept/Reject actions for the lender side.
 */
export default function B2BNegotiationFlow() {
  const [tab, setTab] = useState('incoming') // incoming | outgoing | closed
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const me = useQuery({
    queryKey: ['partner', 'me'],
    queryFn: () => partnerService.getPartnerProfile(),
    staleTime: 5 * 60_000,
  })
  const myPartnerId = me.data?.data?.id ?? me.data?.id

  const shares = useQuery({
    queryKey: ['b2b', 'car-shares'],
    queryFn: () => partnerService.getCarShareRequests(),
    staleTime: 60_000,
  })
  const rows = useMemo(() => {
    const raw = shares.data?.data || shares.data?.results || shares.data || []
    return Array.isArray(raw) ? raw : []
  }, [shares.data])

  const incoming = rows.filter((r) => r.owner?.id === myPartnerId && ['pending', 'accepted'].includes(r.status))
  const outgoing = rows.filter((r) => r.requester?.id === myPartnerId && ['pending', 'accepted'].includes(r.status))
  const closed = rows.filter((r) => ['rejected', 'completed', 'cancelled', 'active'].includes(r.status))

  const visible = tab === 'incoming' ? incoming : tab === 'outgoing' ? outgoing : closed

  const updateStatus = useMutation({
    mutationFn: ({ requestId, status }) => partnerService.updateCarShareRequestStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b', 'car-shares'] })
      showToast('Deal updated.', 'success')
    },
    onError: (err) => {
      showToast(err?.data?.error || err?.message || 'Could not update deal.', 'error')
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <B2BSubNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Deals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Counter-offer, accept, or decline B2B share requests. Acceptance auto-issues a contract.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex gap-1 px-2 py-2">
            {[
              { id: 'incoming', label: `Incoming (${incoming.length})` },
              { id: 'outgoing', label: `Outgoing (${outgoing.length})` },
              { id: 'closed', label: `Closed (${closed.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  tab === t.id ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {shares.isLoading && (
          <div className="flex flex-col items-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <p>Loading deals…</p>
          </div>
        )}
        {shares.isError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p className="text-sm">Could not load your deals. Try again in a moment.</p>
          </div>
        )}
        {!shares.isLoading && !shares.isError && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
            <Car className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-lg font-semibold text-gray-900">Nothing here yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              {tab === 'incoming'
                ? 'No agencies have requested your fleet yet.'
                : tab === 'outgoing'
                ? 'You have not requested any cars from other agencies.'
                : 'Closed deals will appear here once any are settled.'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {visible.map((request) => (
            <DealCard
              key={request.id}
              request={request}
              myPartnerId={myPartnerId}
              onAccept={(price) =>
                updateStatus.mutate({ requestId: request.id, status: 'accepted' })
              }
              onReject={() =>
                updateStatus.mutate({ requestId: request.id, status: 'rejected' })
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DealCard({ request, myPartnerId, onAccept, onReject }) {
  const requester = request.requester || {}
  const owner = request.owner || {}
  const listing = request.listing || {}
  const isOwner = owner.id === myPartnerId
  const otherParty = isOwner ? requester : owner
  const vehicleLabel = `${listing.make || ''} ${listing.model || ''} ${listing.year || ''}`.trim()

  // Negotiation thread (price history) is loaded lazily on expand.
  const [expanded, setExpanded] = useState(true)
  const thread = useQuery({
    queryKey: ['b2b', 'car-shares', request.id, 'messages'],
    queryFn: () => partnerService.getCarShareMessages(request.id),
    enabled: expanded,
    staleTime: 30_000,
  })

  const messages = useMemo(() => {
    const raw = thread.data?.data || thread.data?.results || thread.data || []
    return Array.isArray(raw) ? raw : []
  }, [thread.data])

  // Extract price proposals from message text. We accept the first MAD-looking
  // number on each line; messages without a number are kept as plain notes.
  const priceHistory = useMemo(() => {
    return messages
      .map((m) => {
        const match = (m.text || '').match(/(\d[\d\s,.]*)/)
        if (!match) return null
        const cleaned = Number(String(match[1]).replace(/[\s,.]/g, ''))
        if (Number.isNaN(cleaned) || cleaned <= 0) return null
        return {
          id: m.id,
          from: m.sender?.business_name || m.sender?.businessName || 'Agency',
          fromIsRequester: m.sender?.id === requester.id,
          price: cleaned,
          createdAt: m.created_at,
        }
      })
      .filter(Boolean)
  }, [messages, requester.id])

  const initialOffer = Number(request.total_price)
  if (Number.isFinite(initialOffer) && initialOffer > 0) {
    const head = {
      id: 'initial',
      from: requester.business_name || requester.businessName || 'Requester',
      fromIsRequester: true,
      price: initialOffer,
      createdAt: request.created_at,
    }
    if (!priceHistory.some((p) => p.price === initialOffer && p.fromIsRequester)) {
      priceHistory.unshift(head)
    }
  }

  const lastPrice = priceHistory[priceHistory.length - 1]?.price ?? initialOffer
  const [counter, setCounter] = useState('')

  return (
    <article className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <header className={`px-4 py-3 border-b flex items-center justify-between ${
        request.status === 'accepted' ? 'bg-green-50 border-green-200'
          : request.status === 'rejected' ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-gray-900 truncate">
            {requester.business_name || 'Requester'}
            <ArrowRight className="inline w-4 h-4 mx-1 text-gray-400" />
            {owner.business_name || 'Owner'}
          </span>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 sm:flex-1 min-w-0">
          <AgencyAvatar
            name={otherParty.business_name || otherParty.businessName}
            logoUrl={otherParty.logo_url}
            size={40}
          />
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{vehicleLabel || 'Vehicle'}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {request.start_date} → {request.end_date}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isOwner ? 'Requested by ' : 'You requested from '}
              <span className="font-semibold text-gray-700">
                {(isOwner ? requester : owner).business_name || 'Partner'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end justify-center">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Latest offer</p>
          <p className="text-2xl font-black text-orange-600">{formatMad(lastPrice, '')}</p>
        </div>
      </div>

      {/* Price history */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700"
        >
          Price history
          <span className="text-gray-400">{expanded ? '−' : '+'}</span>
        </button>
        {expanded && (
          <div className="mt-3 space-y-1.5 bg-gray-50 rounded-lg p-3 border border-gray-100">
            {thread.isLoading ? (
              <p className="text-sm text-gray-500">Loading thread…</p>
            ) : priceHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No counter-offers yet.</p>
            ) : (
              priceHistory.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  {h.fromIsRequester ? (
                    <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
                  )}
                  <span className="font-semibold text-gray-700 w-32 truncate">{h.from}</span>
                  <span className="font-bold text-orange-600">{formatMad(h.price, '')}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Inline counter / accept (only when the deal is still open and we are the receiving side) */}
      {request.status === 'pending' && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <CounterOfferRow
            request={request}
            otherParty={otherParty}
            counter={counter}
            setCounter={setCounter}
            onAccept={() => onAccept(lastPrice)}
            onReject={onReject}
            canAcceptReject={isOwner}
          />
        </div>
      )}

      {request.status === 'accepted' && (
        <div className="px-4 py-3 border-t border-green-100 bg-green-50 flex items-center justify-between text-sm">
          <span className="font-semibold text-green-700 inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Contract issued at {formatMad(request.total_price, '/day')}
          </span>
        </div>
      )}
    </article>
  )
}

function CounterOfferRow({ request, otherParty, counter, setCounter, onAccept, onReject, canAcceptReject }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const sendCounter = useMutation({
    mutationFn: (text) => partnerService.sendCarShareMessage(request.id, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b', 'car-shares', request.id, 'messages'] })
      setCounter('')
    },
    onError: (err) => {
      showToast(err?.data?.error || err?.message || 'Could not send counter.', 'error')
    },
  })

  const submitCounter = (e) => {
    e.preventDefault()
    const value = Number(counter)
    if (!Number.isFinite(value) || value <= 0) {
      showToast('Enter a valid MAD amount.', 'error')
      return
    }
    sendCounter.mutate(`Counter: ${value} MAD/day. Reply to confirm or counter again.`)
  }

  return (
    <form onSubmit={submitCounter} className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 hidden sm:inline">Counter with</span>
      <input
        type="number"
        min="1"
        inputMode="numeric"
        value={counter}
        onChange={(e) => setCounter(e.target.value)}
        placeholder="0"
        className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
      <span className="text-sm text-gray-500">MAD</span>
      <button
        type="submit"
        disabled={sendCounter.isLoading}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        Counter
      </button>
      {canAcceptReject && (
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onReject}
            className="px-3 py-2 text-sm font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-3 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Accept
          </button>
        </div>
      )}
    </form>
  )
}
