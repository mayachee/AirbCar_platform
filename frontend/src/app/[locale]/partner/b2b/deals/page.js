'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Loader2, AlertCircle, Calendar, Car, FileText, ArrowRight, ArrowLeft, Send,
  MessageCircle, Clock,
} from 'lucide-react'

import { partnerService } from '@/features/partner/services/partnerService'
import B2BSubNav from '@/components/b2b/B2BSubNav'
import { AgencyAvatar, formatMad, StatusBadge } from '@/components/b2b/common'
import { useToast } from '@/contexts/ToastContext'

/**
 * V2 · Negotiation Flow.
 *
 * The deals page is a quiet room of conversations between agencies. Each
 * card is a paragraph of dialogue: who asked, who answered, at what price,
 * with the back-and-forth surfaced as a price exchange you can read in
 * one glance. Calmer than a CRM, more useful than a chat log.
 */
export default function B2BNegotiationFlow() {
  const [tab, setTab] = useState('incoming')
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

  const incoming = rows.filter(
    (r) => r.owner?.id === myPartnerId && ['pending', 'accepted'].includes(r.status),
  )
  const outgoing = rows.filter(
    (r) => r.requester?.id === myPartnerId && ['pending', 'accepted'].includes(r.status),
  )
  const closed = rows.filter((r) =>
    ['rejected', 'completed', 'cancelled', 'active'].includes(r.status),
  )

  const visible = tab === 'incoming' ? incoming : tab === 'outgoing' ? outgoing : closed

  const updateStatus = useMutation({
    mutationFn: ({ requestId, status }) =>
      partnerService.updateCarShareRequestStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b', 'car-shares'] })
      showToast('Deal updated.', 'success')
    },
    onError: (err) => {
      showToast(err?.data?.error || err?.message || 'Could not update deal.', 'error')
    },
  })

  return (
    <div className="min-h-screen bg-stone-50">
      <B2BSubNav />

      {/* Hero */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
            Conversations in progress
          </p>
          <h1 className="mt-3 text-4xl lg:text-5xl font-black tracking-tight text-stone-900 leading-[1.05]">
            Active deals,{' '}
            <span className="italic font-light text-stone-500">priced and pending.</span>
          </h1>
          <p className="mt-4 text-base text-stone-600 leading-relaxed max-w-2xl">
            Counter, accept, or step away. Every accepted deal auto-issues a contract; every
            counter is sent as a message your counterpart sees on their dashboard.
          </p>

          {/* Tabs */}
          <div className="mt-8 flex gap-1 bg-stone-100 rounded-full p-1 w-max">
            {[
              { id: 'incoming', label: 'Incoming', count: incoming.length },
              { id: 'outgoing', label: 'Outgoing', count: outgoing.length },
              { id: 'closed', label: 'Closed', count: closed.length },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                  tab === t.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {t.label}
                <span className={`ml-2 ${tab === t.id ? 'text-white/70' : 'text-stone-400'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {shares.isLoading && (
          <div className="flex flex-col items-center py-16 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <p className="text-sm">Reading the room…</p>
          </div>
        )}
        {shares.isError && (
          <div className="flex items-start gap-3 p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p className="text-sm">Could not load your deals. Try again in a moment.</p>
          </div>
        )}
        {!shares.isLoading && !shares.isError && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-stone-300 text-center px-6">
            <MessageCircle className="w-10 h-10 mb-3 text-stone-300" />
            <p className="text-lg font-semibold text-stone-900">
              {tab === 'incoming' && 'No agencies are asking for your fleet yet.'}
              {tab === 'outgoing' && 'You haven\'t pitched an agency for a car.'}
              {tab === 'closed' && 'Closed deals will land here once they settle.'}
            </p>
            <p className="text-sm text-stone-500 mt-1 max-w-md">
              {tab === 'outgoing'
                ? 'When you find a car on the marketplace, send an offer — it appears here while you negotiate.'
                : 'The network is quiet. Activity shows up as soon as a request lands.'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {visible.map((request) => (
            <DealCard
              key={request.id}
              request={request}
              myPartnerId={myPartnerId}
              onAccept={(price) => updateStatus.mutate({ requestId: request.id, status: 'accepted' })}
              onReject={() => updateStatus.mutate({ requestId: request.id, status: 'rejected' })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────── Deal card ───────────────────── */

function DealCard({ request, myPartnerId, onAccept, onReject }) {
  const requester = request.requester || {}
  const owner = request.owner || {}
  const listing = request.listing || {}
  const isOwner = owner.id === myPartnerId
  const otherParty = isOwner ? requester : owner
  const vehicleLabel = `${listing.make || ''} ${listing.model || ''} ${listing.year || ''}`.trim()

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

  // Parse MAD numbers out of the chat thread to render a price exchange.
  const priceHistory = useMemo(() => {
    const out = messages
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
          when: m.created_at,
        }
      })
      .filter(Boolean)
    const initialOffer = Number(request.total_price)
    if (Number.isFinite(initialOffer) && initialOffer > 0) {
      const head = {
        id: 'initial',
        from: requester.business_name || requester.businessName || 'Requester',
        fromIsRequester: true,
        price: initialOffer,
        when: request.created_at,
      }
      if (!out.some((p) => p.price === initialOffer && p.fromIsRequester)) out.unshift(head)
    }
    return out
  }, [messages, requester, request])

  const lastPrice = priceHistory[priceHistory.length - 1]?.price ?? Number(request.total_price)
  const [counter, setCounter] = useState('')

  const accentEdge =
    request.status === 'accepted'
      ? 'before:bg-emerald-500'
      : request.status === 'rejected' || request.status === 'cancelled'
      ? 'before:bg-stone-300'
      : request.status === 'active'
      ? 'before:bg-blue-500'
      : 'before:bg-orange-500'

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-white border border-stone-200 rounded-3xl overflow-hidden before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${accentEdge}`}
    >
      <header className="px-6 pt-6 pb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AgencyAvatar
            name={otherParty.business_name || otherParty.businessName}
            logoUrl={otherParty.logo_url}
            size={40}
          />
          <div className="min-w-0">
            <h3 className="font-bold text-stone-900 text-base leading-tight">
              {requester.business_name || 'Requester'}
              <ArrowRight className="inline w-3.5 h-3.5 mx-1.5 text-stone-300" />
              {owner.business_name || 'Owner'}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Started {timeAgo(request.created_at)}
              <span className="mx-1">·</span>
              <Calendar className="w-3 h-3" />
              {request.start_date} → {request.end_date}
            </p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <div className="px-6 pb-4 flex flex-wrap items-end justify-between gap-3 border-b border-stone-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-stone-400" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-stone-900 text-sm truncate">
              {vehicleLabel || 'Vehicle'}
            </p>
            <p className="text-[11px] text-stone-500 truncate">
              {isOwner ? 'Requested by ' : 'You requested from '}
              <span className="font-semibold text-stone-700">
                {(isOwner ? requester : owner).business_name || 'Partner'}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-stone-500">Latest offer</p>
          <p className="text-2xl font-black text-stone-900">{formatMad(lastPrice, '')}</p>
        </div>
      </div>

      {/* Price exchange */}
      <div className="px-6 py-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-700 transition-colors"
        >
          The exchange
          <span className="text-stone-400">{expanded ? '−' : '+'}</span>
        </button>

        {expanded && (
          <div className="mt-3">
            {thread.isLoading ? (
              <p className="text-sm text-stone-500">Loading thread…</p>
            ) : priceHistory.length === 0 ? (
              <p className="text-sm text-stone-500 italic">No counter-offers yet.</p>
            ) : (
              <ol className="space-y-2.5">
                {priceHistory.map((h) => (
                  <li
                    key={h.id}
                    className={`flex items-center ${
                      h.fromIsRequester ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        h.fromIsRequester
                          ? 'bg-blue-50 border border-blue-100 rounded-bl-sm'
                          : 'bg-orange-50 border border-orange-100 rounded-br-sm'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        {h.from}
                      </p>
                      <p className="text-base font-black text-stone-900">
                        {formatMad(h.price, '')}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* Inline counter / accept */}
      {request.status === 'pending' && (
        <CounterOfferRow
          request={request}
          counter={counter}
          setCounter={setCounter}
          onAccept={() => onAccept(lastPrice)}
          onReject={onReject}
          canAcceptReject={isOwner}
        />
      )}

      {request.status === 'accepted' && (
        <div className="px-6 py-4 border-t border-emerald-100 bg-emerald-50/60 flex items-center justify-between text-sm">
          <span className="font-semibold text-emerald-700 inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Contract issued at {formatMad(request.total_price, '/day')}
          </span>
        </div>
      )}
    </motion.article>
  )
}

function CounterOfferRow({ request, counter, setCounter, onAccept, onReject, canAcceptReject }) {
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
    <form
      onSubmit={submitCounter}
      className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex flex-wrap items-center gap-2"
    >
      <span className="text-sm text-stone-500 hidden sm:inline">Counter with</span>
      <input
        type="number"
        min="1"
        inputMode="numeric"
        value={counter}
        onChange={(e) => setCounter(e.target.value)}
        placeholder="0"
        className="w-28 px-3 py-2 border border-stone-300 rounded-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
      />
      <span className="text-sm text-stone-500">MAD</span>
      <button
        type="submit"
        disabled={sendCounter.isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-stone-900 rounded-full hover:bg-stone-700 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        Counter
      </button>
      {canAcceptReject && (
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onReject}
            className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-full hover:bg-emerald-700"
          >
            Accept
          </button>
        </div>
      )}
    </form>
  )
}

/* ───────────────────── helpers ───────────────────── */

function timeAgo(iso) {
  if (!iso) return 'recently'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  if (diff < 60_000) return 'a moment ago'
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  return `${Math.round(diff / 86_400_000)}d ago`
}
