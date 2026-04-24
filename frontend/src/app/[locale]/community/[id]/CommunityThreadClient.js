'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Share2,
  ThumbsUp,
  BadgeCheck,
  ShieldCheck,
  Heart,
  Reply,
  X,
  ImagePlus,
  Loader2,
  MessageCircle,
  Car,
  Headphones,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { listingsService } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

const MAX_COMMENT_IMAGES = 4

function getVehicleImages(vehicle) {
  if (!vehicle?.images) return []
  return vehicle.images
    .map((img) => {
      if (!img) return null
      if (typeof img === 'string') return img
      return img.image || img.url || null
    })
    .filter(Boolean)
    .map((u) => (u.endsWith('?') ? u.slice(0, -1) : u))
}

function getUserDisplayName(user, fallback = 'Someone') {
  if (!user) return fallback
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return full || user.username || user.email?.split('@')[0] || fallback
}

function getUserInitial(user) {
  const name = getUserDisplayName(user, '?')
  return name.charAt(0).toUpperCase() || '?'
}

function formatRelative(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return ''
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatPostedDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CommunityThreadClient({ vehicleId, initialVehicle, initialComments }) {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || 'en'
  const queryClient = useQueryClient()
  const t = useTranslations('community_thread')
  const { user: authUser } = useAuth()

  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [commentImages, setCommentImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  const { data: vehicleData } = useQuery({
    queryKey: ['listingDetail', vehicleId],
    queryFn: () => listingsService.getListing(vehicleId),
    initialData: initialVehicle ? { data: initialVehicle } : undefined,
    enabled: !!vehicleId,
  })

  const vehicle = vehicleData?.data || vehicleData || initialVehicle

  const { data: commentsData } = useQuery({
    queryKey: ['vehicleComments', vehicleId],
    queryFn: () => listingsService.getVehicleComments(vehicleId),
    initialData: initialComments ? { data: { results: initialComments } } : undefined,
    enabled: !!vehicleId,
  })

  const comments = useMemo(() => {
    return (
      commentsData?.data?.results ||
      commentsData?.results ||
      commentsData?.data ||
      (Array.isArray(commentsData) ? commentsData : []) ||
      initialComments ||
      []
    )
  }, [commentsData, initialComments])

  const { data: reactionsData } = useQuery({
    queryKey: ['vehicleReactions', vehicleId],
    queryFn: () => listingsService.getVehicleReactions(vehicleId),
    enabled: !!vehicleId,
  })

  const reactionSummary = reactionsData?.data?.summary || reactionsData?.summary || []
  const userReaction = reactionsData?.data?.user_reaction || reactionsData?.user_reaction || null
  const reactCount = reactionSummary.reduce((acc, curr) => acc + (curr.count || 0), 0)
  const reactionsQueryKey = ['vehicleReactions', vehicleId]

  const reactMutation = useMutation({
    mutationFn: ({ action, reaction }) => {
      if (action === 'remove') return listingsService.removeVehicleReaction(vehicleId)
      return listingsService.addVehicleReaction(vehicleId, reaction)
    },
    onMutate: async ({ action, reaction }) => {
      await queryClient.cancelQueries({ queryKey: reactionsQueryKey })
      const snapshot = queryClient.getQueryData(reactionsQueryKey)

      queryClient.setQueryData(reactionsQueryKey, (old) => {
        const payload = old?.data || old || { summary: [], user_reaction: null }
        const prevUser = payload.user_reaction
        const nextUser = action === 'remove' ? null : reaction
        const summary = [...(payload.summary || [])]

        const bump = (key, delta) => {
          if (!key) return
          const i = summary.findIndex((s) => s.reaction === key)
          if (i === -1) {
            if (delta > 0) summary.push({ reaction: key, count: delta })
          } else {
            const c = (summary[i].count || 0) + delta
            if (c <= 0) summary.splice(i, 1)
            else summary[i] = { ...summary[i], count: c }
          }
        }
        if (prevUser && prevUser !== nextUser) bump(prevUser, -1)
        if (nextUser && nextUser !== prevUser) bump(nextUser, 1)

        const nextPayload = { summary, user_reaction: nextUser }
        return old?.data ? { ...old, data: nextPayload } : nextPayload
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) queryClient.setQueryData(reactionsQueryKey, ctx.snapshot)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reactionsQueryKey })
    },
  })

  const commentMutation = useMutation({
    mutationFn: ({ text, parentId, images }) =>
      listingsService.addVehicleComment(vehicleId, text, parentId, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleComments', vehicleId] })
      setCommentText('')
      setCommentImages([])
      setReplyingTo(null)
      setUploadError(null)
    },
  })

  const handleAppreciate = () => {
    if (reactMutation.isPending) return
    if (userReaction === 'like') {
      reactMutation.mutate({ action: 'remove' })
    } else {
      reactMutation.mutate({ action: 'add', reaction: 'like' })
    }
  }

  const handleFilesChosen = async (event) => {
    const files = Array.from(event.target.files || [])
    if (event.target) event.target.value = ''
    if (!files.length) return

    const room = MAX_COMMENT_IMAGES - commentImages.length
    const toUpload = files.slice(0, Math.max(0, room))
    if (!toUpload.length) {
      setUploadError(t('max_images_reached', { max: MAX_COMMENT_IMAGES }))
      return
    }

    setUploadingImages(true)
    setUploadError(null)
    try {
      const uploaded = []
      for (const file of toUpload) {
        const res = await listingsService.uploadCommunityImage(file)
        const url = res?.data?.url || res?.url
        if (url) uploaded.push(url)
      }
      setCommentImages((prev) => [...prev, ...uploaded].slice(0, MAX_COMMENT_IMAGES))
    } catch (err) {
      setUploadError(err?.message || t('image_upload_failed'))
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (url) => {
    setCommentImages((prev) => prev.filter((u) => u !== url))
  }

  const handlePostComment = () => {
    const text = commentText.trim()
    if (!text && commentImages.length === 0) return
    commentMutation.mutate({ text, parentId: replyingTo?.id, images: commentImages })
  }

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    const title = vehicle?.name || 'Airbcar thread'
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl })
        return
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl)
      } catch {}
    }
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-24 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {t('thread_not_found')}
          </h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {t('thread_not_found_desc')}
          </p>
          <Link
            href={`/${locale}/search`}
            className="inline-block mt-6 px-6 py-3 bg-[var(--color-kc-primary)] text-white rounded-xl font-semibold text-sm hover:brightness-95"
          >
            {t('browse_vehicles')}
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const images = getVehicleImages(vehicle)
  const heroImage = images[0] || '/carsymbol.jpg'
  const secondImage = images[1] || heroImage
  const thirdImage = images[2] || secondImage
  const extraPhotos = Math.max(0, images.length - 3)

  const partner = vehicle.partner
  const hostName =
    partner?.business_name ||
    [partner?.user?.first_name, partner?.user?.last_name].filter(Boolean).join(' ') ||
    t('host_badge')
  const hostAvatar =
    partner?.logo_url ||
    partner?.logo ||
    partner?.user?.profile_picture_url ||
    partner?.user?.profile_picture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(hostName)}`

  const vehicleName =
    vehicle.name || [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle'
  const partnerId = partner?.id || partner?.slug
  const partnerHref = partnerId ? `/${locale}/partner/${partnerId}` : null
  const carHref = `/${locale}/car/${vehicleId}`
  const description = vehicle.description || ''

  const currentUserAvatar =
    authUser?.profile_picture_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser?.username || 'guest')}`

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Immersive header */}
      <div className="relative h-[60vh] min-h-[460px] md:h-[65vh] md:min-h-[500px] w-full overflow-hidden">
        <img
          alt={vehicleName}
          src={heroImage}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.85) 100%)',
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto px-4 md:px-8 w-full pb-10 md:pb-16">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">
                {t('back_to_hub')}
              </span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4 md:mb-6 flex-wrap">
                  <span className="bg-[var(--color-kc-primary)] px-3 py-1 rounded text-[10px] font-black text-white uppercase tracking-widest">
                    {t('featured_story')}
                  </span>
                  <span className="text-white/60 text-xs font-medium">
                    {t('comments_count', { count: comments.length })}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-5 md:mb-6 leading-[1.05] drop-shadow-2xl">
                  {vehicleName}
                </h1>
                <div className="flex items-center gap-4">
                  <img
                    alt={hostName}
                    src={hostAvatar}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-bold text-base md:text-lg truncate">{hostName}</p>
                    <p className="text-[var(--color-kc-primary-container)] text-[10px] uppercase tracking-widest font-black">
                      {t('official_agency')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: content + discussion */}
          <section className="lg:col-span-8 space-y-12 md:space-y-16">
            {/* Editorial paragraph with drop cap */}
            {description && (
              <div className="prose prose-slate max-w-none">
                <p className="text-lg md:text-xl leading-relaxed text-[var(--text-secondary)] font-light first-letter:text-6xl md:first-letter:text-7xl first-letter:font-black first-letter:text-[var(--color-kc-primary)] first-letter:mr-3 first-letter:float-left first-letter:leading-[0.9]">
                  {description}
                </p>
              </div>
            )}

            {/* Bento photo grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 h-auto md:h-[480px] lg:h-[600px]">
                <div className="md:col-span-8 rounded-3xl overflow-hidden relative group shadow-2xl h-[280px] md:h-auto">
                  <img
                    alt={vehicleName}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    src={heroImage}
                  />
                  {vehicle.location && (
                    <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold border border-white/20">
                      {vehicle.location}
                    </div>
                  )}
                </div>
                <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4 md:h-full">
                  <div className="rounded-3xl overflow-hidden shadow-lg md:h-1/2 h-[160px] md:h-auto">
                    <img
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      src={secondImage}
                    />
                  </div>
                  <div className="rounded-3xl overflow-hidden relative group shadow-lg md:h-1/2 h-[160px] md:h-auto">
                    <img
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={thirdImage}
                    />
                    {extraPhotos > 0 && (
                      <Link
                        href={carHref}
                        className="absolute inset-0 bg-black/55 hover:bg-black/40 backdrop-blur-sm transition-colors flex items-center justify-center"
                      >
                        <span className="text-white text-xs font-bold uppercase tracking-widest">
                          {t('view_more_photos', { count: extraPhotos })}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 py-6 md:py-8 border-y border-[var(--surface-3)]">
              <button
                type="button"
                onClick={handleAppreciate}
                disabled={reactMutation.isPending}
                aria-pressed={!!userReaction}
                className={`flex items-center gap-2 px-5 md:px-6 py-3 rounded-full font-bold transition-all ${
                  userReaction
                    ? 'bg-[var(--color-kc-primary)] text-white shadow-lg shadow-[var(--color-kc-primary)]/20'
                    : 'bg-[var(--color-kc-primary)]/10 text-[var(--color-kc-primary)] hover:bg-[var(--color-kc-primary)] hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${userReaction ? 'fill-white' : ''}`} />
                <span>
                  {reactCount > 0
                    ? t('appreciation_count', { count: reactCount })
                    : t('appreciate')}
                </span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-5 md:px-6 py-3 rounded-full bg-[var(--surface-2)] text-[var(--text-primary)] font-bold hover:bg-[var(--surface-3)] transition-all"
              >
                <Share2 className="w-5 h-5" />
                <span>{t('share_trip')}</span>
              </button>
              <Link
                href={carHref}
                className="flex items-center gap-2 px-5 md:px-6 py-3 rounded-full bg-[var(--surface-2)] text-[var(--text-primary)] font-bold hover:bg-[var(--surface-3)] transition-all"
              >
                <Car className="w-5 h-5" />
                <span>{t('view_listing')}</span>
              </Link>
              {vehicle.created_at && (
                <div className="ml-auto text-[10px] md:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                  {t('posted_on', { date: formatPostedDate(vehicle.created_at) })}
                </div>
              )}
            </div>

            {/* Discussion */}
            <div className="space-y-8 md:space-y-10">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                  {t('the_discussion')}{' '}
                  <span className="text-[var(--color-kc-primary)] ml-2">{comments.length}</span>
                </h3>
                <div className="flex gap-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-kc-primary)] underline underline-offset-4">
                    {t('newest_first')}
                  </span>
                </div>
              </div>

              {/* Post comment composer */}
              <div className="bg-white rounded-3xl p-5 md:p-7 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] border border-[var(--surface-3)]">
                <div className="flex gap-4 md:gap-5">
                  <img
                    alt=""
                    src={currentUserAvatar}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-grow space-y-3 md:space-y-4 min-w-0">
                    {replyingTo && (
                      <div className="flex items-center justify-between bg-[var(--surface-1)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg text-xs font-medium w-max max-w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <Reply className="w-3.5 h-3.5 opacity-70 shrink-0" />
                          <span className="truncate">
                            {t('replying_to', { name: replyingTo.author })}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="ml-3 p-0.5 hover:bg-black/5 rounded transition-colors"
                          title={t('cancel_reply')}
                          aria-label={t('cancel_reply')}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <textarea
                      ref={textareaRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={commentMutation.isPending}
                      className="w-full border-none bg-[var(--surface-1)] rounded-2xl p-4 md:p-5 text-sm md:text-base focus:ring-2 focus:ring-[var(--color-kc-primary)]/30 focus:outline-none placeholder:text-[var(--text-secondary)] min-h-[110px] md:min-h-[120px] resize-none transition-all text-[var(--text-primary)]"
                      placeholder={
                        replyingTo ? t('write_reply') : t('add_to_conversation')
                      }
                    />

                    {commentImages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {commentImages.map((url) => (
                          <div
                            key={url}
                            className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--surface-3)]"
                          >
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(url)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                              aria-label="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {uploadError && <span className="text-xs text-red-500">{uploadError}</span>}
                    {commentMutation.isError && (
                      <span className="text-xs text-red-500">{t('sign_in_required')}</span>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          hidden
                          onChange={handleFilesChosen}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={
                            uploadingImages ||
                            commentMutation.isPending ||
                            commentImages.length >= MAX_COMMENT_IMAGES
                          }
                          className="p-2.5 md:p-3 text-[var(--text-secondary)] hover:text-[var(--color-kc-primary)] transition-colors rounded-xl hover:bg-[var(--color-kc-primary)]/5 disabled:opacity-50"
                          aria-label={t('attach_image')}
                        >
                          {uploadingImages ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <ImagePlus className="w-5 h-5" />
                          )}
                        </button>
                        {commentImages.length > 0 && (
                          <span className="text-xs text-[var(--text-secondary)] self-center">
                            {commentImages.length}/{MAX_COMMENT_IMAGES}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handlePostComment}
                        disabled={
                          (!commentText.trim() && commentImages.length === 0) ||
                          uploadingImages ||
                          commentMutation.isPending
                        }
                        className="bg-[var(--color-kc-primary)] hover:brightness-95 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[var(--color-kc-primary)]/20 disabled:opacity-50"
                      >
                        {commentMutation.isPending ? t('posting') : t('post_comment')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment list */}
              <div className="space-y-8 md:space-y-10">
                {comments.length === 0 && (
                  <div className="text-center py-10 px-6 border border-dashed border-[var(--surface-3)] rounded-3xl">
                    <MessageCircle className="w-7 h-7 mx-auto text-[var(--text-secondary)] opacity-50 mb-3" />
                    <p className="text-sm text-[var(--text-secondary)]">{t('be_first')}</p>
                  </div>
                )}

                {comments.map((comment) => {
                  const isHost =
                    comment.user?.id &&
                    partner?.user?.id &&
                    comment.user.id === partner.user.id
                  const commenterName = getUserDisplayName(comment.user)
                  const commenterAvatar =
                    comment.user?.profile_picture_url || comment.user?.profile_picture || null

                  return (
                    <div key={comment.id} className="group">
                      <div className="flex gap-4 md:gap-6">
                        <div className="shrink-0">
                          {commenterAvatar ? (
                            <img
                              alt={commenterName}
                              src={commenterAvatar}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-4 ring-white shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--surface-2)] text-[var(--text-primary)] ring-4 ring-white shadow-md flex items-center justify-center text-base font-bold uppercase">
                              {getUserInitial(comment.user)}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0 space-y-3 md:space-y-4">
                          <div className="bg-white p-5 md:p-7 rounded-3xl rounded-tl-none shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] border border-[var(--surface-3)]">
                            <div className="flex items-center justify-between gap-3 mb-3 md:mb-4 flex-wrap">
                              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                <span className="font-bold text-base md:text-lg text-[var(--text-primary)] truncate">
                                  {commenterName}
                                </span>
                                {isHost ? (
                                  <span className="bg-[var(--color-kc-primary)]/10 text-[var(--color-kc-primary)] px-2 md:px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                    <BadgeCheck className="w-3 h-3" />
                                    {t('host_badge')}
                                  </span>
                                ) : (
                                  comment.user?.is_verified && (
                                    <span className="bg-emerald-50 text-emerald-600 px-2 md:px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                                      {t('verified_driver')}
                                    </span>
                                  )
                                )}
                              </div>
                              <span className="text-xs font-bold text-[var(--text-secondary)] shrink-0">
                                {formatRelative(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                            {Array.isArray(comment.images) && comment.images.length > 0 && (
                              <div
                                className={`mt-4 grid gap-2 ${
                                  comment.images.length === 1
                                    ? 'grid-cols-1 max-w-xs'
                                    : 'grid-cols-2 max-w-md'
                                }`}
                              >
                                {comment.images.map((url) => (
                                  <button
                                    key={url}
                                    type="button"
                                    onClick={() => setLightboxImage(url)}
                                    className="rounded-xl overflow-hidden aspect-square bg-[var(--surface-2)] hover:opacity-90 transition-opacity"
                                    aria-label="View image"
                                  >
                                    <img
                                      src={url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="mt-5 md:mt-6 flex items-center gap-5 md:gap-6">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo({ id: comment.id, author: commenterName })
                                  if (textareaRef.current) {
                                    window.scrollTo({
                                      top: textareaRef.current.offsetTop - 200,
                                      behavior: 'smooth',
                                    })
                                    setTimeout(() => textareaRef.current?.focus(), 500)
                                  }
                                }}
                                className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-[var(--color-kc-primary)] hover:opacity-80"
                              >
                                {t('reply')}
                              </button>
                              <span className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--color-kc-primary)] transition-colors text-xs font-bold">
                                <ThumbsUp className="w-3.5 h-3.5" />
                                {comment.likes_count || 0}
                              </span>
                            </div>
                          </div>

                          {/* Nested replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-6 md:ml-12 space-y-4">
                              {comment.replies.map((reply) => {
                                const isReplyHost =
                                  reply.user?.id &&
                                  partner?.user?.id &&
                                  reply.user.id === partner.user.id
                                const replyAuthor = getUserDisplayName(reply.user)
                                const replyAvatar =
                                  reply.user?.profile_picture_url ||
                                  reply.user?.profile_picture ||
                                  null

                                return (
                                  <div key={reply.id} className="flex gap-3 md:gap-5">
                                    <div className="shrink-0">
                                      {replyAvatar ? (
                                        <img
                                          alt={replyAuthor}
                                          src={replyAvatar}
                                          className={`w-9 h-9 md:w-10 md:h-10 rounded-full object-cover shadow ${
                                            isReplyHost ? 'border-2 border-[var(--color-kc-primary)]' : 'ring-2 ring-white'
                                          }`}
                                        />
                                      ) : (
                                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase ${
                                          isReplyHost
                                            ? 'bg-slate-900 text-white border-2 border-[var(--color-kc-primary)]'
                                            : 'bg-[var(--surface-2)] text-[var(--text-primary)] ring-2 ring-white'
                                        }`}>
                                          {getUserInitial(reply.user)}
                                        </div>
                                      )}
                                    </div>
                                    <div
                                      className={`flex-grow rounded-3xl rounded-tl-none p-4 md:p-5 border ${
                                        isReplyHost
                                          ? 'bg-[var(--color-kc-primary)]/5 border-[var(--color-kc-primary)]/15'
                                          : 'bg-[var(--surface-1)] border-[var(--surface-3)]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="font-bold text-sm text-[var(--text-primary)]">
                                          {replyAuthor}
                                        </span>
                                        {isReplyHost && (
                                          <>
                                            <BadgeCheck className="w-3.5 h-3.5 text-[var(--color-kc-primary)]" />
                                            <span className="text-[10px] font-black text-[var(--color-kc-primary)] uppercase tracking-widest">
                                              {t('official_agency')}
                                            </span>
                                          </>
                                        )}
                                        <span className="text-[10px] text-[var(--text-secondary)] ml-auto">
                                          {formatRelative(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                                        {reply.content}
                                      </p>
                                      {Array.isArray(reply.images) && reply.images.length > 0 && (
                                        <div
                                          className={`mt-3 grid gap-2 ${
                                            reply.images.length === 1
                                              ? 'grid-cols-1 max-w-[180px]'
                                              : 'grid-cols-2 max-w-xs'
                                          }`}
                                        >
                                          {reply.images.map((url) => (
                                            <button
                                              key={url}
                                              type="button"
                                              onClick={() => setLightboxImage(url)}
                                              className="rounded-lg overflow-hidden aspect-square bg-[var(--surface-2)] hover:opacity-90 transition-opacity"
                                              aria-label="View image"
                                            >
                                              <img
                                                src={url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Right: dark booking widget + community code */}
          <aside className="lg:col-span-4 space-y-6 md:space-y-8 lg:sticky lg:top-10">
            {/* Dark booking widget */}
            <div className="relative bg-slate-900 text-white rounded-[2rem] p-7 md:p-8 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5 md:mb-6">
                  <span className="bg-[var(--color-kc-primary)]/20 text-[var(--color-kc-primary-container)] px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                    {t('available_fleet')}
                  </span>
                </div>
                <h4 className="text-2xl md:text-3xl font-black mb-2">{hostName}</h4>
                <p className="text-slate-400 text-sm mb-7 md:mb-8 leading-relaxed">
                  {partner?.description || partner?.bio || t('fleet_subtitle')}
                </p>
                <div className="space-y-3.5 md:space-y-4 mb-7 md:mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-[var(--color-kc-primary-container)] shrink-0" />
                    <span>{t('feature_insurance')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Headphones className="w-5 h-5 text-[var(--color-kc-primary-container)] shrink-0" />
                    <span>{t('feature_concierge')}</span>
                  </div>
                </div>
                <Link
                  href={carHref}
                  className="block w-full text-center bg-[var(--color-kc-primary)] hover:brightness-110 text-white py-3.5 md:py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-[var(--color-kc-primary)]/30"
                >
                  {t('book_this_car')}
                </Link>
                {partnerHref && (
                  <Link
                    href={partnerHref}
                    className="block mt-3 w-full text-center border border-white/20 text-white py-3 rounded-2xl font-medium text-sm hover:bg-white/5 transition-colors"
                  >
                    {t('view_fleet')}
                  </Link>
                )}
              </div>
              <div
                aria-hidden
                className="absolute -right-8 -bottom-12 opacity-[0.06] pointer-events-none group-hover:scale-110 transition-transform duration-1000"
              >
                <Car className="w-[200px] h-[200px] md:w-[240px] md:h-[240px]" strokeWidth={1.25} />
              </div>
            </div>

            {/* Community code */}
            <div className="bg-[var(--surface-1)] rounded-[2rem] p-7 md:p-8 border border-[var(--surface-3)]">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <ShieldCheck className="w-4 h-4 text-[var(--color-kc-primary)]" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
                  {t('community_code')}
                </h4>
              </div>
              <div className="space-y-5 md:space-y-6">
                {[t('code_rule_1'), t('code_rule_2'), t('code_rule_3')].map((rule, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-[var(--color-kc-primary)] font-black text-xs shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxImage(null)
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

      <Footer />
    </div>
  )
}
