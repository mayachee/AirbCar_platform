'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Share2,
  ThumbsUp,
  BadgeCheck,
  Car,
  ShieldCheck,
  Star,
  Reply,
  X,
  ImagePlus,
  Loader2,
  MessageCircle,
  MapPin,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { listingsService } from '@/services/api'

const REACTION_OPTIONS = [
  { key: 'like', emoji: '👍' },
  { key: 'love', emoji: '❤️' },
  { key: 'fire', emoji: '🔥' },
  { key: 'wow', emoji: '😮' },
]

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

function getUserDisplayName(user) {
  if (!user) return 'Someone'
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return full || user.username || user.email?.split('@')[0] || 'Someone'
}

function getUserInitial(user) {
  const name = getUserDisplayName(user)
  return name.charAt(0).toUpperCase() || '?'
}

function formatRelative(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
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

export default function CommunityThreadClient({ vehicleId, initialVehicle, initialComments }) {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || 'en'
  const queryClient = useQueryClient()
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

  const handleReact = (reactionKey) => {
    if (reactMutation.isPending) return
    if (userReaction === reactionKey) {
      reactMutation.mutate({ action: 'remove' })
    } else {
      reactMutation.mutate({ action: 'add', reaction: reactionKey })
    }
  }

  const handleFilesChosen = async (event) => {
    const files = Array.from(event.target.files || [])
    if (event.target) event.target.value = ''
    if (!files.length) return

    const room = MAX_COMMENT_IMAGES - commentImages.length
    const toUpload = files.slice(0, Math.max(0, room))
    if (!toUpload.length) {
      setUploadError(`You can attach up to ${MAX_COMMENT_IMAGES} images.`)
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
      setUploadError(err?.message || 'Image upload failed.')
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
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Thread not found</h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            This community thread is not available or has been removed.
          </p>
          <Link
            href={`/${locale}/search`}
            className="inline-block mt-6 px-6 py-3 bg-[var(--color-kc-primary)] text-white rounded-xl font-semibold text-sm hover:brightness-95"
          >
            Browse vehicles
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
    'Host'
  const hostAvatar =
    partner?.logo_url ||
    partner?.logo ||
    partner?.user?.profile_picture_url ||
    partner?.user?.profile_picture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(hostName)}`

  const vehicleName =
    vehicle.name || [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle'
  const vehicleLocation = vehicle.location || vehicle.city || ''
  const partnerRating = Number(partner?.rating || 0)
  const partnerReviews = partner?.review_count || 0
  const partnerId = partner?.id || partner?.slug
  const partnerHref = partnerId ? `/${locale}/partner/${partnerId}` : null

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community</span>
        </button>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-4 pb-16">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
                {vehicleName}
              </h1>
              <div className="mt-2 flex items-center gap-x-2 gap-y-1 text-sm flex-wrap">
                {partnerRating > 0 && (
                  <>
                    <span className="flex items-center gap-1 text-[var(--text-primary)]">
                      <Star className="w-4 h-4 fill-[var(--text-primary)] text-[var(--text-primary)]" />
                      <span className="font-medium">{partnerRating.toFixed(1)}</span>
                      {partnerReviews > 0 && (
                        <span className="text-[var(--text-secondary)]">({partnerReviews} reviews)</span>
                      )}
                    </span>
                    <span className="text-[var(--text-secondary)]">·</span>
                  </>
                )}
                {vehicleLocation && (
                  <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{vehicleLocation}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <Link
                href={`/${locale}/car/${vehicleId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <Car className="w-4 h-4" />
                <span className="hidden sm:inline">View listing</span>
              </Link>
            </div>
          </div>
        </header>

        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-auto sm:h-[460px] mb-10">
            <div className="rounded-2xl overflow-hidden relative h-[280px] sm:h-auto">
              <img
                alt={vehicleName}
                className="w-full h-full object-cover"
                src={heroImage}
              />
            </div>
            <div className="grid grid-rows-2 gap-3 h-[360px] sm:h-auto">
              <div className="rounded-2xl overflow-hidden">
                <img
                  alt={`${vehicleName} angle`}
                  className="w-full h-full object-cover"
                  src={secondImage}
                />
              </div>
              <div className="rounded-2xl overflow-hidden relative">
                <img
                  alt={`${vehicleName} interior`}
                  className="w-full h-full object-cover"
                  src={thirdImage}
                />
                {extraPhotos > 0 && (
                  <Link
                    href={`/${locale}/car/${vehicleId}`}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/55 transition-colors"
                  >
                    <span className="text-white text-sm font-semibold">+{extraPhotos} photos</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 divide-y divide-[var(--surface-3)]">
            <div className="pb-10">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    alt={hostName}
                    src={hostAvatar}
                    className="w-14 h-14 rounded-full object-cover border border-[var(--surface-3)]"
                  />
                  {partner?.is_verified && (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full">
                      <BadgeCheck className="w-4 h-4 text-[var(--color-kc-primary)]" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--text-secondary)]">Hosted by</p>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                    {hostName}
                  </h3>
                  {(partner?.description || partner?.bio) && (
                    <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                      {partner.description || partner.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {vehicle.description && (
              <div className="py-10">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                  About this vehicle
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                  {vehicle.description}
                </p>
              </div>
            )}

            <div className="py-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-[var(--surface-1)] rounded-full p-1 border border-[var(--surface-3)]">
                  {REACTION_OPTIONS.map((opt) => {
                    const count = reactionSummary.find((s) => s.reaction === opt.key)?.count || 0
                    const active = userReaction === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleReact(opt.key)}
                        disabled={reactMutation.isPending}
                        aria-label={`React ${opt.key}`}
                        aria-pressed={active}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all ${
                          active
                            ? 'bg-white shadow-sm ring-1 ring-[var(--surface-3)]'
                            : 'hover:bg-white/60'
                        }`}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        {count > 0 && (
                          <span className="text-xs font-medium text-[var(--text-primary)]">{count}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {reactCount > 0 && (
                  <span className="text-xs text-[var(--text-secondary)]">
                    {reactCount} reactions
                  </span>
                )}
                {vehicle.created_at && (
                  <span className="ml-auto text-xs text-[var(--text-secondary)]">
                    Posted {formatRelative(vehicle.created_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="py-10">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-5">
                Discussion ({comments.length})
              </h3>

              <div className="mb-8 p-4 rounded-2xl border border-[var(--surface-3)] bg-white">
                <div className="flex flex-col gap-3">
                  {replyingTo && (
                    <div className="flex items-center justify-between bg-[var(--surface-1)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg text-xs font-medium w-max">
                      <div className="flex items-center gap-2">
                        <Reply className="w-3.5 h-3.5 opacity-70" />
                        <span>Replying to {replyingTo.author}</span>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="ml-3 p-0.5 hover:bg-black/5 rounded transition-colors"
                        title="Cancel reply"
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
                    className="w-full bg-transparent border border-[var(--surface-3)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-kc-primary)] focus:border-transparent outline-none transition-all min-h-[96px] resize-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                    placeholder={
                      replyingTo
                        ? 'Write your reply…'
                        : 'Share your experience or ask about this vehicle…'
                    }
                  />

                  {commentImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {commentImages.map((url) => (
                        <div
                          key={url}
                          className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--surface-3)]"
                        >
                          <img src={url} alt="attachment" className="w-full h-full object-cover" />
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

                  {uploadError && (
                    <span className="text-xs text-red-500">{uploadError}</span>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
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
                      className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--surface-3)] hover:border-[var(--text-secondary)] transition-colors disabled:opacity-50"
                      aria-label="Attach image"
                    >
                      {uploadingImages ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {commentImages.length
                          ? `${commentImages.length}/${MAX_COMMENT_IMAGES}`
                          : 'Add photos'}
                      </span>
                    </button>
                    {commentMutation.isError && (
                      <span className="text-xs text-red-500">Sign in to post a comment.</span>
                    )}
                    <div className="flex-grow" />
                    <button
                      onClick={handlePostComment}
                      disabled={
                        (!commentText.trim() && commentImages.length === 0) ||
                        uploadingImages ||
                        commentMutation.isPending
                      }
                      className="bg-[var(--color-kc-primary)] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:brightness-95 disabled:opacity-50 transition-all"
                    >
                      {commentMutation.isPending ? 'Posting…' : 'Post comment'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {comments.length === 0 && (
                  <div className="text-center py-10 px-6 border border-dashed border-[var(--surface-3)] rounded-2xl">
                    <MessageCircle className="w-7 h-7 mx-auto text-[var(--text-secondary)] opacity-50 mb-3" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Be the first to start the conversation.
                    </p>
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
                    <div key={comment.id} className="flex gap-3">
                      <div className="h-10 w-10 rounded-full shrink-0 overflow-hidden border border-[var(--surface-3)] flex items-center justify-center text-sm font-semibold uppercase bg-[var(--surface-1)] text-[var(--text-primary)]">
                        {commenterAvatar ? (
                          <img
                            alt={commenterName}
                            src={commenterAvatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getUserInitial(comment.user)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {commenterName}
                          </span>
                          {isHost && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[var(--surface-1)] text-[var(--color-kc-primary)] rounded flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3" />
                              Host
                            </span>
                          )}
                          <span className="text-xs text-[var(--text-secondary)]">
                            · {formatRelative(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        {Array.isArray(comment.images) && comment.images.length > 0 && (
                          <div
                            className={`mt-3 grid gap-2 ${
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
                                  alt="comment attachment"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-4">
                          <button
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
                            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            <Reply className="w-3.5 h-3.5" /> Reply
                          </button>
                          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <ThumbsUp className="w-3 h-3" /> {comment.likes_count || 0}
                          </span>
                        </div>

                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 space-y-4 pl-4 border-l-2 border-[var(--surface-3)]">
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
                                <div key={reply.id} className="flex gap-3">
                                  <div className="h-8 w-8 rounded-full shrink-0 overflow-hidden border border-[var(--surface-3)] flex items-center justify-center text-xs font-semibold uppercase bg-[var(--surface-1)] text-[var(--text-primary)]">
                                    {replyAvatar ? (
                                      <img
                                        alt={replyAuthor}
                                        src={replyAvatar}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      getUserInitial(reply.user)
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                                        {replyAuthor}
                                      </span>
                                      {isReplyHost && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[var(--surface-1)] text-[var(--color-kc-primary)] rounded flex items-center gap-1">
                                          <BadgeCheck className="w-3 h-3" />
                                          Host
                                        </span>
                                      )}
                                      <span className="text-xs text-[var(--text-secondary)]">
                                        · {formatRelative(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
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
                                              alt="reply attachment"
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
                  )
                })}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-[var(--surface-3)] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
              <h4 className="text-base font-semibold mb-4 text-[var(--text-primary)]">
                Vehicle at a glance
              </h4>
              <dl className="space-y-3 text-sm">
                {vehicle.make && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Make</dt>
                    <dd className="font-medium text-[var(--text-primary)]">{vehicle.make}</dd>
                  </div>
                )}
                {vehicle.model && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Model</dt>
                    <dd className="font-medium text-[var(--text-primary)]">{vehicle.model}</dd>
                  </div>
                )}
                {vehicle.year && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Year</dt>
                    <dd className="font-medium text-[var(--text-primary)]">{vehicle.year}</dd>
                  </div>
                )}
                {(vehicle.price || vehicle.price_per_day) && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Daily rate</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {vehicle.price || vehicle.price_per_day} MAD
                    </dd>
                  </div>
                )}
                {vehicleLocation && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-secondary)]">Location</dt>
                    <dd className="font-medium text-[var(--text-primary)]">{vehicleLocation}</dd>
                  </div>
                )}
              </dl>
              <Link
                href={`/${locale}/car/${vehicleId}`}
                className="block mt-5 w-full text-center bg-[var(--color-kc-primary)] text-white py-3 rounded-xl font-semibold text-sm hover:brightness-95 transition-all"
              >
                Book this car
              </Link>
              {partnerHref && (
                <Link
                  href={partnerHref}
                  className="block mt-2 w-full text-center border border-[var(--surface-3)] text-[var(--text-primary)] py-3 rounded-xl font-medium text-sm hover:bg-[var(--surface-1)] transition-colors"
                >
                  View fleet
                </Link>
              )}
            </div>

            <div className="bg-[var(--surface-1)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-[var(--text-primary)]" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Community code
                </h4>
              </div>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-[var(--text-secondary)] shrink-0">01</span>
                  <span>Verified reviews only. Respect the road and local laws.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--text-secondary)] shrink-0">02</span>
                  <span>No aggressive promotional content from non-agency accounts.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--text-secondary)] shrink-0">03</span>
                  <span>Keep it professional. We are a community of enthusiasts.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

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
