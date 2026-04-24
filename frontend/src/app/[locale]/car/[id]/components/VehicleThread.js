'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Heart, MessageSquare, Share2, Send, Pin, ArrowRight, ThumbsUp } from 'lucide-react'
import { listingsService } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function relativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s`
  if (diff < 3600) return `${Math.round(diff / 60)}m`
  if (diff < 86400) return `${Math.round(diff / 3600)}h`
  if (diff < 604800) return `${Math.round(diff / 86400)}d`
  return d.toLocaleDateString()
}

export default function VehicleThread({ vehicle }) {
  const t = useTranslations('car_details')
  const queryClient = useQueryClient()
  const params = useParams()
  const locale = params?.locale || 'en'
  const { user } = useAuth()
  const [commentText, setCommentText] = useState('')

  const vehicleId = vehicle?.id
  const partner = vehicle?.partner
  const threadHref = vehicleId ? `/${locale}/community/${vehicleId}` : null

  const { data: reactionsData } = useQuery({
    queryKey: ['vehicleReactions', vehicleId],
    queryFn: () => listingsService.getVehicleReactions(vehicleId),
    enabled: !!vehicleId,
  })

  const { data: commentsData } = useQuery({
    queryKey: ['vehicleComments', vehicleId],
    queryFn: () => listingsService.getVehicleComments(vehicleId),
    enabled: !!vehicleId,
  })

  const summary = reactionsData?.data?.summary || reactionsData?.summary || []
  const userReaction = reactionsData?.data?.user_reaction || reactionsData?.user_reaction || null
  const reactCount = summary.reduce((acc, curr) => acc + curr.count, 0)
  const comments = commentsData?.data?.results || commentsData?.results || []

  const reactMutation = useMutation({
    mutationFn: (action) => {
      if (action === 'add') return listingsService.addVehicleReaction(vehicleId, 'like')
      return listingsService.removeVehicleReaction(vehicleId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleReactions', vehicleId] })
    },
  })

  const commentMutation = useMutation({
    mutationFn: (text) => listingsService.addVehicleComment(vehicleId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleComments', vehicleId] })
      setCommentText('')
    },
  })

  const handleReact = () => {
    reactMutation.mutate(userReaction ? 'remove' : 'add')
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    commentMutation.mutate(commentText)
  }

  const hostName =
    partner?.business_name ||
    [partner?.user?.first_name, partner?.user?.last_name].filter(Boolean).join(' ') ||
    t('host')
  const hostAvatar =
    partner?.logo_url ||
    partner?.user?.profile_picture_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(hostName)}`
  const heroImage =
    vehicle?.images?.[0]?.image ||
    (typeof vehicle?.images?.[0] === 'string' ? vehicle.images[0] : null) ||
    '/carsymbol.jpg'

  const participantCount = (() => {
    const ids = new Set()
    comments.forEach((c) => c.user?.id && ids.add(c.user.id))
    if (partner?.user?.id) ids.add(partner.user.id)
    return ids.size
  })()

  const currentUserAvatar =
    user?.profile_picture_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.username || 'guest')}`

  return (
    <section>
      {/* Section heading */}
      <div className="flex justify-between items-end mb-6 md:mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <span className="w-1.5 h-8 bg-teal-500 rounded-full" />
          {t('vehicle_thread')}
        </h2>
        {participantCount > 0 && (
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {t('participants', { count: participantCount })}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Pinned post from owner */}
        <div className="relative bg-white p-5 md:p-6 rounded-2xl shadow-sm ring-2 ring-[var(--color-kc-primary)]/10 border border-[var(--color-kc-primary)]/5">
          <div className="absolute -top-3 left-6 bg-[var(--color-kc-primary)] text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-md">
            <Pin className="w-3 h-3" /> {t('pinned_by_owner')}
          </div>
          {threadHref && (
            <Link
              href={threadHref}
              className="absolute -top-3 right-6 bg-white border border-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--color-kc-primary)] hover:border-[var(--color-kc-primary)] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1 transition-colors"
            >
              {t('open_thread')} <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          <div className="flex gap-4 mt-2">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--color-kc-primary)]/20 shrink-0">
              <img src={hostAvatar} alt={hostName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-bold text-[var(--text-primary)]">{hostName}</span>
                <span className="bg-[var(--color-kc-primary)]/10 text-[var(--color-kc-primary)] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                  {t('host')}
                </span>
                <span className="text-xs text-[var(--text-secondary)] ml-auto">
                  {t('original_post')}
                </span>
              </div>

              <p className="text-[var(--text-primary)] leading-relaxed mb-4 text-sm md:text-base">
                {vehicle?.description || t('no_thread_content')}
              </p>

              <div className="w-full h-56 md:h-72 rounded-xl overflow-hidden bg-[var(--surface-2)] mb-4">
                <img src={heroImage} alt={vehicle?.name || ''} className="w-full h-full object-cover" />
              </div>

              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={handleReact}
                  disabled={reactMutation.isPending}
                  className={`flex items-center gap-2 transition-colors text-sm ${
                    userReaction
                      ? 'text-[var(--color-kc-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--color-kc-primary)]'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${userReaction ? 'fill-[var(--color-kc-primary)]' : ''}`}
                  />
                  <span className="font-bold">{reactCount}</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-kc-primary)] transition-colors text-sm font-bold"
                >
                  <MessageSquare className="w-5 h-5" />
                  {t('reply')}
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-kc-primary)] transition-colors ml-auto"
                  aria-label={t('share')}
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies divider */}
        {comments.length > 0 && (
          <div className="relative py-2">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--surface-3)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                {t('replies')}
              </span>
            </div>
          </div>
        )}

        {/* Comments */}
        {comments.map((comment) => {
          const isHost = comment.user?.id === partner?.user?.id
          const commenterName = comment.user?.first_name
            ? `${comment.user.first_name} ${comment.user.last_name || ''}`.trim()
            : comment.user?.username || 'Someone'
          const commenterAvatar =
            comment.user?.profile_picture_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(commenterName)}`

          return (
            <div key={comment.id} className="flex gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--surface-2)] shrink-0">
                <img src={commenterAvatar} alt={commenterName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow min-w-0">
                <div
                  className={`p-4 rounded-2xl rounded-tl-none border ${
                    isHost
                      ? 'bg-[var(--color-kc-primary)]/5 border-[var(--color-kc-primary)]/10'
                      : 'bg-[var(--surface-1)] border-[var(--surface-3)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {commenterName}
                    </span>
                    {isHost && (
                      <span className="bg-[var(--color-kc-primary)]/10 text-[var(--color-kc-primary)] px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                        {t('host')}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--text-secondary)] ml-auto">
                      {relativeTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {comment.content || comment.comment}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-2 ml-2">
                  <button
                    type="button"
                    className="text-[10px] font-black text-[var(--text-secondary)] hover:text-[var(--color-kc-primary)] uppercase tracking-widest flex items-center gap-1"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {comment.likes_count || 0}
                  </button>
                  <button
                    type="button"
                    className="text-[10px] font-black text-[var(--text-secondary)] hover:text-[var(--color-kc-primary)] uppercase tracking-widest"
                  >
                    {t('reply')}
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* View full thread CTA */}
        {threadHref && comments.length > 0 && (
          <div className="flex justify-center pt-2">
            <Link
              href={threadHref}
              className="group inline-flex items-center gap-2 text-sm font-bold text-[var(--color-kc-primary)] hover:opacity-80 transition-opacity"
            >
              {t('view_full_thread')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}

        {/* Reply input */}
        <div className="flex gap-3 items-center bg-white p-3 md:p-4 rounded-2xl border border-[var(--surface-3)] focus-within:border-[var(--color-kc-primary)] focus-within:ring-2 focus-within:ring-[var(--color-kc-primary)]/20 transition-all">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
          </div>
          <input
            type="text"
            placeholder={t('write_reply')}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            disabled={commentMutation.isPending}
            className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-sm py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
          <button
            type="button"
            onClick={handleComment}
            disabled={!commentText.trim() || commentMutation.isPending}
            className="bg-[var(--color-kc-primary)] text-white p-2.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
            aria-label={t('reply')}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
