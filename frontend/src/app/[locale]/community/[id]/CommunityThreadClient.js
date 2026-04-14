'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Heart,
  Share2,
  ThumbsUp,
  BadgeCheck,
  Car,
  ShieldCheck,
  Search,
  Users,
  Map,
  Menu,
  MessageCircle,
  Star,
  Reply,
  X,
} from 'lucide-react'
import { listingsService } from '@/services/api'

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

  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)

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

  const reactionSummary =
    reactionsData?.data?.summary || reactionsData?.summary || []
  const userReaction =
    reactionsData?.data?.user_reaction || reactionsData?.user_reaction || null
  const reactCount = reactionSummary.reduce(
    (acc, curr) => acc + (curr.count || 0),
    0
  )

  const reactMutation = useMutation({
    mutationFn: (action) => {
      if (action === 'add')
        return listingsService.addVehicleReaction(vehicleId, 'like')
      return listingsService.removeVehicleReaction(vehicleId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleReactions', vehicleId] })
    },
  })

  const commentMutation = useMutation({
    mutationFn: ({ text, parentId }) => listingsService.addVehicleComment(vehicleId, text, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleComments', vehicleId] })
      setCommentText('')
      setReplyingTo(null)
    },
  })

  const handleReact = () => {
    reactMutation.mutate(userReaction ? 'remove' : 'add')
  }

  const handlePostComment = () => {
    const text = commentText.trim()
    if (!text) return
    commentMutation.mutate({ text, parentId: replyingTo?.id })
  }

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined' ? window.location.href : ''
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
      <div className="min-h-screen flex items-center justify-center bg-background text-kc-on-surface">
        <div className="text-center space-y-4 px-6">
          <h1 className="text-2xl font-bold">Thread not found</h1>
          <p className="text-sm text-kc-on-surface-variant">
            This community thread is not available or has been removed.
          </p>
          <Link
            href={`/${locale}/search`}
            className="inline-block mt-4 px-6 py-3 bg-kc-primary text-white rounded-xl font-bold text-sm"
          >
            Browse vehicles
          </Link>
        </div>
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
    [partner?.user?.first_name, partner?.user?.last_name]
      .filter(Boolean)
      .join(' ') ||
    'Host'
  const hostAvatar =
    partner?.logo_url ||
    partner?.logo ||
    partner?.user?.profile_picture_url ||
    partner?.user?.profile_picture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(hostName)}`

  const vehicleName =
    vehicle.name ||
    [vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
    'Vehicle'
  const vehicleLocation = vehicle.location || vehicle.city || ''
  const partnerRating = Number(partner?.rating || 0)
  const partnerReviews = partner?.review_count || 0
  const partnerId = partner?.id || partner?.slug
  const partnerHref = partnerId ? `/${locale}/partner/${partnerId}` : null

  return (
    <div className="bg-background text-foreground selection:bg-kc-primary-container selection:text-kc-on-primary-container min-h-screen pb-24 md:pb-0">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-10">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-kc-on-surface-variant opacity-70 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase">
            Back to Community
          </span>
        </button>

        <header className="mb-12 max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-kc-primary">
              Vehicle Thread
            </span>
            {vehicleLocation && (
              <>
                <span className="text-kc-on-surface-variant opacity-40">•</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-kc-on-surface-variant">
                  {vehicleLocation}
                </span>
              </>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-kc-on-surface mb-6 leading-tight">
            {vehicleName}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-background overflow-hidden shrink-0 shadow-sm">
              <img
                alt={hostName}
                src={hostAvatar}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-kc-on-surface">
                  {hostName}
                </span>
                {partner?.is_verified && (
                  <BadgeCheck className="w-4 h-4 text-kc-primary fill-kc-primary/20" />
                )}
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-kc-primary">
                Fleet Partner
              </span>
            </div>
            {partnerRating > 0 && (
              <>
                <div className="h-8 w-px bg-kc-outline-variant/30 hidden sm:block mx-1" />
                <div className="flex items-center gap-1.5 text-kc-on-surface">
                  <Star className="w-4 h-4 fill-kc-primary text-kc-primary" />
                  <span className="text-sm font-bold">
                    {partnerRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-kc-on-surface-variant opacity-60">
                    ({partnerReviews})
                  </span>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <section className="space-y-12">
            <div className="bg-kc-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_32px_64px_rgba(18,28,42,0.04)]">
              {vehicle.description && (
                <div className="prose prose-slate max-w-none mb-10">
                  <p className="text-lg leading-relaxed text-kc-on-surface-variant whitespace-pre-wrap">
                    {vehicle.description}
                  </p>
                </div>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto sm:h-[500px] mb-10">
                  <div className="rounded-2xl overflow-hidden relative group h-[300px] sm:h-auto">
                    <img
                      alt={vehicleName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      src={heroImage}
                    />
                  </div>
                  <div className="grid grid-rows-2 gap-4 h-[400px] sm:h-auto">
                    <div className="rounded-2xl overflow-hidden">
                      <img
                        alt={`${vehicleName} angle`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        src={secondImage}
                      />
                    </div>
                    <div className="rounded-2xl overflow-hidden relative">
                      <img
                        alt={`${vehicleName} interior`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        src={thirdImage}
                      />
                      {extraPhotos > 0 && (
                        <Link
                          href={`/${locale}/car/${vehicleId}`}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/55 transition-colors"
                        >
                          <span className="text-white font-bold">
                            +{extraPhotos} Photos
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleReact}
                  disabled={reactMutation.isPending}
                  className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors disabled:opacity-60 ${
                    userReaction
                      ? 'bg-kc-primary-container text-white'
                      : 'bg-kc-secondary-container text-kc-on-secondary-container hover:bg-kc-primary-container hover:text-white'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${userReaction ? 'fill-current' : ''}`}
                  />
                  <span className="text-sm font-bold">{reactCount}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="bg-kc-surface-container text-kc-on-secondary-container px-4 py-2 rounded-full flex items-center gap-2 hover:opacity-80 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Share</span>
                </button>
                <Link
                  href={`/${locale}/car/${vehicleId}`}
                  className="bg-kc-surface-container text-kc-on-secondary-container px-4 py-2 rounded-full flex items-center gap-2 hover:opacity-80 transition-colors"
                >
                  <Car className="w-5 h-5" />
                  <span className="text-sm font-bold">View listing</span>
                </Link>
                <div className="flex-grow" />
                {vehicle.created_at && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-kc-on-surface-variant opacity-50 whitespace-nowrap">
                    Posted {formatRelative(vehicle.created_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-2xl font-bold tracking-tight px-2 text-kc-on-surface">
                Discussion ({comments.length})
              </h3>

              <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6 bg-kc-surface-container-low rounded-2xl">
                <div className="hidden sm:flex h-10 w-10 rounded-full bg-kc-surface-container-high shrink-0 overflow-hidden border border-kc-outline-variant/30 items-center justify-center text-kc-on-surface-variant">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-grow flex flex-col gap-3">
                  {replyingTo && (
                    <div className="flex items-center justify-between bg-kc-secondary-container text-kc-on-secondary-container px-4 py-2 rounded-xl text-sm font-bold w-max shadow-sm">
                      <div className="flex items-center gap-2">
                        <Reply className="w-4 h-4 opacity-70" />
                        <span>Replying to {replyingTo.author}</span>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="ml-4 p-1 hover:bg-black/10 rounded-md transition-colors" title="Cancel reply">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={commentMutation.isPending}
                    className="w-full bg-kc-surface-container-lowest border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-kc-primary-container/40 outline-none transition-all min-h-[100px] resize-none text-kc-on-surface placeholder:text-kc-on-surface-variant/50 shadow-inner"
                    placeholder={replyingTo ? "Write your reply..." : "Share your experience or ask about this vehicle..."}
                  />
                  <div className="flex justify-between items-center">
                    {commentMutation.isError && (
                      <span className="text-xs text-red-500">
                        Sign in to post a comment.
                      </span>
                    )}
                    <div className="flex-grow" />
                    <button
                      onClick={handlePostComment}
                      disabled={
                        !commentText.trim() || commentMutation.isPending
                      }
                      className="bg-gradient-to-br from-kc-primary to-kc-primary-container text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {commentMutation.isPending ? 'Posting…' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {comments.length === 0 && (
                  <div className="text-center py-12 px-6 bg-kc-surface-container-lowest rounded-2xl">
                    <MessageCircle className="w-8 h-8 mx-auto text-kc-on-surface-variant opacity-40 mb-3" />
                    <p className="text-sm text-kc-on-surface-variant">
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
                    comment.user?.profile_picture_url ||
                    comment.user?.profile_picture ||
                    null

                  return (
                    <div key={comment.id} className="flex gap-3 sm:gap-4">
                      <div
                        className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0 overflow-hidden ring-4 ring-background flex items-center justify-center text-sm font-bold uppercase ${
                          isHost
                            ? 'bg-kc-primary-container text-white'
                            : 'bg-kc-surface-container-high text-kc-on-surface'
                        }`}
                      >
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
                      <div className="flex-grow">
                        <div className="bg-kc-surface-container-lowest p-5 sm:p-6 rounded-2xl rounded-tl-none shadow-sm">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-bold text-kc-on-surface">
                              {commenterName}
                            </span>
                            {isHost && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-kc-primary-container/10 text-kc-primary rounded flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3" />
                                Host
                              </span>
                            )}
                            <span className="text-[10px] text-kc-on-surface-variant opacity-50 font-bold uppercase tracking-widest ml-auto">
                              {formatRelative(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-kc-on-surface-variant leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <div className="mt-4 pt-4 border-t border-kc-outline-variant/10 flex items-center justify-between">
                            <button
                              onClick={() => {
                                setReplyingTo({ id: comment.id, author: commenterName })
                                if (textareaRef.current) {
                                  window.scrollTo({ top: textareaRef.current.offsetTop - 200, behavior: 'smooth' })
                                  setTimeout(() => textareaRef.current?.focus(), 500)
                                }
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-kc-primary hover:bg-kc-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Reply className="w-4 h-4" /> Reply
                            </button>
                            <div className="flex gap-4">
                              <span className="text-[10px] font-bold text-kc-on-surface-variant/40 flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" /> {comment.likes_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* RENDER REPLIES */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 space-y-4 pl-4 sm:pl-6 border-l-2 border-kc-outline-variant/20">
                            {comment.replies.map((reply) => {
                              const isReplyHost = reply.user?.id && partner?.user?.id && reply.user.id === partner.user.id
                              const replyAuthor = getUserDisplayName(reply.user)
                              const replyAvatar = reply.user?.profile_picture_url || reply.user?.profile_picture || null

                              return (
                                <div key={reply.id} className="flex gap-3 h-auto">
                                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0 overflow-hidden ring-2 ring-background flex items-center justify-center text-xs font-bold uppercase bg-kc-surface-container-highest text-kc-on-surface">
                                    {replyAvatar ? (
                                      <img alt={replyAuthor} src={replyAvatar} className="w-full h-full object-cover" />
                                    ) : (
                                      getUserInitial(reply.user)
                                    )}
                                  </div>
                                  <div className="flex-grow bg-kc-surface-container-lowest p-4 sm:p-5 rounded-2xl rounded-tl-none shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <span className="text-sm font-bold text-kc-on-surface">{replyAuthor}</span>
                                      {isReplyHost && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-kc-primary-container/10 text-kc-primary rounded flex items-center gap-1">
                                          <BadgeCheck className="w-3 h-3" />
                                          Host
                                        </span>
                                      )}
                                      <span className="text-[10px] text-kc-on-surface-variant opacity-50 font-bold uppercase tracking-widest ml-auto">
                                        {formatRelative(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-kc-on-surface-variant leading-relaxed whitespace-pre-wrap">
                                      {reply.content}
                                    </p>
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
          </section>

          <aside className="space-y-8">
            <div className="bg-gradient-to-br from-kc-inverse-surface to-slate-900 text-white rounded-3xl p-8 overflow-hidden relative shadow-lg">
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-kc-primary-container mb-4 block opacity-90">
                  Fleet Partner
                </span>
                <h4 className="text-2xl font-bold mb-2">{hostName}</h4>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  {partner?.description ||
                    partner?.bio ||
                    `Verified host on Airbcar${
                      vehicleLocation ? ` in ${vehicleLocation}` : ''
                    }.`}
                </p>
                {partnerRating > 0 && (
                  <div className="flex items-center gap-2 mb-6 text-sm">
                    <Star className="w-4 h-4 fill-kc-primary text-kc-primary" />
                    <span className="font-bold">
                      {partnerRating.toFixed(1)}
                    </span>
                    <span className="text-slate-400">
                      · {partnerReviews} reviews
                    </span>
                  </div>
                )}
                {partnerHref ? (
                  <Link
                    href={partnerHref}
                    className="block w-full text-center bg-white text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-kc-primary-container hover:text-white transition-all shadow-sm"
                  >
                    View Fleet
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-white/40 text-slate-900 py-3 rounded-xl font-bold text-sm"
                  >
                    View Fleet
                  </button>
                )}
              </div>
              <Car className="absolute -bottom-4 -right-4 w-40 h-40 opacity-10 rotate-12" />
            </div>

            <div className="bg-kc-surface-container-lowest rounded-3xl p-8 shadow-sm">
              <h4 className="text-lg font-bold mb-6 text-kc-on-surface">
                Vehicle at a glance
              </h4>
              <dl className="space-y-4 text-sm">
                {vehicle.make && (
                  <div className="flex justify-between">
                    <dt className="text-kc-on-surface-variant opacity-70">
                      Make
                    </dt>
                    <dd className="font-bold text-kc-on-surface">
                      {vehicle.make}
                    </dd>
                  </div>
                )}
                {vehicle.model && (
                  <div className="flex justify-between">
                    <dt className="text-kc-on-surface-variant opacity-70">
                      Model
                    </dt>
                    <dd className="font-bold text-kc-on-surface">
                      {vehicle.model}
                    </dd>
                  </div>
                )}
                {vehicle.year && (
                  <div className="flex justify-between">
                    <dt className="text-kc-on-surface-variant opacity-70">
                      Year
                    </dt>
                    <dd className="font-bold text-kc-on-surface">
                      {vehicle.year}
                    </dd>
                  </div>
                )}
                {(vehicle.price || vehicle.price_per_day) && (
                  <div className="flex justify-between">
                    <dt className="text-kc-on-surface-variant opacity-70">
                      Daily rate
                    </dt>
                    <dd className="font-bold text-kc-primary">
                      {vehicle.price || vehicle.price_per_day} MAD
                    </dd>
                  </div>
                )}
                {vehicleLocation && (
                  <div className="flex justify-between">
                    <dt className="text-kc-on-surface-variant opacity-70">
                      Location
                    </dt>
                    <dd className="font-bold text-kc-on-surface">
                      {vehicleLocation}
                    </dd>
                  </div>
                )}
              </dl>
              <Link
                href={`/${locale}/car/${vehicleId}`}
                className="block mt-6 w-full text-center bg-kc-primary-container/10 text-kc-primary py-3 rounded-xl font-bold text-sm hover:bg-kc-primary-container hover:text-white transition-colors"
              >
                Book this car
              </Link>
            </div>

            <div className="bg-kc-surface-container-low rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-kc-tertiary" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-kc-on-surface">
                  Community Code
                </h4>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-kc-primary font-bold text-xs mt-0.5">
                    01
                  </span>
                  <p className="text-xs text-kc-on-surface-variant leading-relaxed">
                    Verified reviews only. Respect the road and local laws.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-kc-primary font-bold text-xs mt-0.5">
                    02
                  </span>
                  <p className="text-xs text-kc-on-surface-variant leading-relaxed">
                    No aggressive promotional content from non-agency accounts.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-kc-primary font-bold text-xs mt-0.5">
                    03
                  </span>
                  <p className="text-xs text-kc-on-surface-variant leading-relaxed">
                    Keep it professional. We are a community of enthusiasts.
                  </p>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4 bg-background/90 backdrop-blur-lg rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50 border-t border-kc-outline-variant/10">
        <Link
          href={`/${locale}/search`}
          className="flex flex-col items-center justify-center text-kc-on-surface-variant opacity-60 hover:opacity-100 transition-opacity"
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">
            Explore
          </span>
        </Link>
        <Link
          href={`/${locale}/community`}
          className="flex flex-col items-center justify-center text-kc-primary scale-110 transition-transform"
        >
          <Users className="w-6 h-6 fill-current" />
          <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">
            Social
          </span>
        </Link>
        <Link
          href={`/${locale}/trips`}
          className="flex flex-col items-center justify-center text-kc-on-surface-variant opacity-60 hover:opacity-100 transition-opacity"
        >
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">
            My Trips
          </span>
        </Link>
        <Link
          href={`/${locale}/profile`}
          className="flex flex-col items-center justify-center text-kc-on-surface-variant opacity-60 hover:opacity-100 transition-opacity"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">
            Menu
          </span>
        </Link>
      </div>
    </div>
  )
}
