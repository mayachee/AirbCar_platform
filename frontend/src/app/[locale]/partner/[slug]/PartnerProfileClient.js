'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Star,
  Award,
  Share2,
  MessageCircle,
  Settings,
  Bolt,
  Check,
  Send,
} from 'lucide-react'
import ComposeRequestModal from '@/features/partner/components/ComposeRequestModal'
import { useTranslations } from 'next-intl'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BackButton from './BackButton'
import { fetchPartnerProfile } from './api'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { partnerService } from '@/features/partner/services/partnerService'

function formatRelative(dateStr) {
  if (!dateStr) return ''
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getUserDisplayName(user) {
  if (!user) return 'Guest'
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return full || user.username || user.email?.split('@')[0] || 'Guest'
}

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function PartnerProfileClient({ initialPartner = null, initialListings = [] }) {
  const params = useParams()
  const locale = params?.locale || 'en'
  const { formatPrice } = useCurrency()
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast?.() || { showToast: () => {} }
  const t = useTranslations('partner_public')

  const [partner, setPartner] = useState(initialPartner)
  const [listings, setListings] = useState(initialListings)
  const [loading, setLoading] = useState(!initialPartner)
  const [error, setError] = useState(null)

  const [isFollowing, setIsFollowing] = useState(initialPartner?.is_following || false)
  const [followerCount, setFollowerCount] = useState(initialPartner?.follower_count || 0)
  const [followBusy, setFollowBusy] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)

  const [reviews, setReviews] = useState([])
  const [reviewsTotal, setReviewsTotal] = useState(0)

  const partnerId = partner?.id

  // Fetch follow state if user is authenticated to override SSR guest data
  useEffect(() => {
    if (!isAuthenticated || !partnerId) return
    let cancelled = false
    partnerService.getFollowState(partnerId)
      .then((res) => {
        if (cancelled) return
        const data = res?.data || res
        if (data && typeof data.is_following !== 'undefined') {
          setIsFollowing(data.is_following)
          setFollowerCount(data.follower_count)
        }
      })
      .catch((err) => {
        console.warn('Failed to load partner follow state:', err)
      })
    return () => {
      cancelled = true
    }
  }, [partnerId, isAuthenticated])

  useEffect(() => {
    if (initialPartner) return

    const load = async () => {
      try {
        setLoading(true)
        const slug = params.slug
        if (!slug) {
          setError('Partner not found')
          return
        }
        const partnerData = await fetchPartnerProfile(slug)
        if (!partnerData) {
          setError('Partner not found')
          return
        }
        const actual = partnerData?.data || partnerData
        setPartner(actual)
        setListings(actual?.listings || actual?.vehicles || [])
        setIsFollowing(actual?.is_following || false)
        setFollowerCount(actual?.follower_count || 0)
      } catch (err) {
        console.error('Error loading partner:', err)
        setError(err.message || 'Failed to load partner')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params.slug, initialPartner])

  useEffect(() => {
    if (!partnerId) return
    let cancelled = false
    partnerService
      .getPartnerPublicReviews(partnerId, { pageSize: 6 })
      .then((res) => {
        if (cancelled) return
        const payload = res?.data || res || {}
        setReviews(Array.isArray(payload.data) ? payload.data : [])
        setReviewsTotal(payload.total_count || 0)
      })
      .catch((err) => {
        console.warn('Failed to load partner reviews:', err)
      })
    return () => {
      cancelled = true
    }
  }, [partnerId])

  const handleFollow = async () => {
    if (!isAuthenticated) {
      showToast?.('Sign in to follow this partner', 'info')
      return
    }
    if (!partnerId || followBusy) return
    setFollowBusy(true)
    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)
    setFollowerCount((c) => Math.max(0, c + (wasFollowing ? -1 : 1)))
    try {
      if (wasFollowing) {
        await partnerService.unfollowPartner(partnerId)
      } else {
        await partnerService.followPartner(partnerId)
      }
    } catch (err) {
      setIsFollowing(wasFollowing)
      setFollowerCount((c) => Math.max(0, c + (wasFollowing ? 1 : -1)))
      showToast?.(err?.message || 'Failed to update follow status', 'error')
    } finally {
      setFollowBusy(false)
    }
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = partner?.business_name || 'Airbcar partner'
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        showToast?.('Profile link copied', 'success')
      } catch {}
    }
  }

  const recentPosts = useMemo(() => {
    const posts = partner?.recent_posts
    return Array.isArray(posts) ? posts : []
  }, [partner])

  if (loading) {
    return (
      <div className="min-h-screen bg-kc-surface">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-kc-primary/30 rounded-3xl animate-spin border-t-kc-primary" />
            <p className="text-kc-on-surface-variant font-medium animate-pulse">{t('loading')}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-kc-surface">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-kc-surface-container-lowest rounded-3xl shadow-sm border border-kc-outline-variant/30 p-8">
              <h2 className="text-xl font-bold text-kc-on-surface mb-2">{t('not_found')}</h2>
              <p className="text-kc-on-surface-variant mb-6">{error || t('not_found_desc')}</p>
              <BackButton />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const companyName = partner.business_name || partner.company_name || [partner.user?.first_name, partner.user?.last_name].filter(Boolean).join(' ') || 'Partner'
  const description = partner.description || partner.bio || ''
  const viewerIsPartner = (user?.role === 'partner') || user?.is_partner === true
  const isOwnProfile = !!user?.id && !!partner?.user?.id && String(user.id) === String(partner.user.id)
  const canMessage = viewerIsPartner && !isOwnProfile
  const totalBookings = partner.total_bookings || 0
  const reviewCount = partner.review_count || reviewsTotal || 0
  const rating = Number(partner.rating || 0)
  const fleetCount = listings.length || partner.listing_count || 0

  const coverUrl = partner.cover_image || partner.coverUrl || null
  const logoUrl = partner.logo_url || partner.logo || partner.user?.profile_picture_url || partner.user?.profile_picture || null

  return (
    <div className="min-h-screen bg-kc-surface text-kc-on-surface">
      <Header />

      <main className="min-h-screen pb-20">
        <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-kc-primary/20 via-kc-surface-container-high to-kc-surface-container-highest">
            {coverUrl && (
              <img
                alt={`${companyName} cover`}
                className="w-full h-full object-cover"
                src={coverUrl}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row items-end justify-between gap-6">
              <div className="flex items-end gap-6">
                <div className="w-32 h-32 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-2xl shrink-0 flex items-center justify-center text-4xl font-black text-kc-primary">
                  {logoUrl ? (
                    <img alt={`${companyName} logo`} className="w-full h-full object-cover" src={logoUrl} />
                  ) : (
                    <span>{getInitials(companyName)}</span>
                  )}
                </div>
                <div className="pb-2 text-white">
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl font-black tracking-tighter">{companyName}</h2>
                    {partner.is_verified && <Award className="text-kc-primary w-7 h-7 fill-kc-primary" />}
                  </div>
                  {description && (
                    <p className="text-slate-200 font-medium text-lg mt-1 max-w-xl line-clamp-2">{description}</p>
                  )}
                  <p className="text-slate-300 text-sm mt-2 font-bold uppercase tracking-widest">
                    {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pb-2">
                <button
                  onClick={handleShare}
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/20 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followBusy}
                  className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${
                    isFollowing
                      ? 'bg-white/90 text-kc-on-surface hover:bg-white'
                      : 'bg-kc-primary text-white shadow-kc-primary/30 hover:scale-105 active:scale-95'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isFollowing && <Check className="w-4 h-4" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                {canMessage && (
                  <button
                    onClick={() => setComposeOpen(true)}
                    className="px-6 py-3 rounded-xl font-bold bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Message
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-kc-surface-container-lowest p-8 rounded-3xl shadow-sm border border-kc-outline-variant/30 flex flex-col items-center text-center">
              <span className="text-4xl font-black text-kc-primary tracking-tighter">{totalBookings}</span>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-kc-on-surface-variant/70 mt-2">Total Journeys</span>
            </div>
            <div className="bg-kc-surface-container-lowest p-8 rounded-3xl shadow-sm border border-kc-outline-variant/30 flex flex-col items-center text-center">
              <span className="text-4xl font-black text-kc-on-surface tracking-tighter">{fleetCount}</span>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-kc-on-surface-variant/70 mt-2">Active Fleet Size</span>
            </div>
            <div className="bg-kc-surface-container-lowest p-8 rounded-3xl shadow-sm border border-kc-outline-variant/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-kc-on-surface tracking-tighter">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                {rating > 0 && <Star className="text-kc-primary w-8 h-8 fill-kc-primary" />}
              </div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-kc-on-surface-variant/70 mt-2">
                Client Rating ({reviewCount})
              </span>
            </div>
          </div>
        </section>

        <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-black tracking-tight text-kc-on-surface">Latest Threads</h3>
              <span className="text-kc-on-surface-variant/70 text-xs font-bold uppercase tracking-widest">
                {recentPosts.length} {recentPosts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {recentPosts.length === 0 ? (
              <div className="bg-kc-surface-container-lowest rounded-[2rem] border border-kc-outline-variant/30 p-12 text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-4 text-kc-on-surface-variant opacity-40" />
                <p className="text-kc-on-surface-variant">{companyName} has not posted yet.</p>
              </div>
            ) : (
              recentPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-kc-surface-container-lowest rounded-[2rem] border border-kc-outline-variant/30 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                >
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-50 bg-kc-surface-container-high flex items-center justify-center text-kc-primary font-black">
                        {post.partner_logo_url ? (
                          <img alt={companyName} src={post.partner_logo_url} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(companyName)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-kc-on-surface">{post.partner_name || companyName}</h4>
                        <p className="text-xs text-kc-on-surface-variant/70 font-medium">
                          {formatRelative(post.created_at)}
                          {post.post_type && post.post_type !== 'update' && ` • ${post.post_type.replace('_', ' ')}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg leading-relaxed text-kc-on-surface-variant mb-8 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {post.image_url && (
                      <div className="rounded-2xl overflow-hidden aspect-[16/9] mb-8 relative">
                        <img alt={post.linked_listing_name || 'Post image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={post.image_url} />
                      </div>
                    )}
                    {post.linked_listing && post.linked_listing_name && (
                      <Link
                        href={`/${locale}/car/${post.linked_listing}`}
                        className="inline-block bg-kc-on-surface text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-kc-primary transition-all"
                      >
                        View {post.linked_listing_name}
                      </Link>
                    )}
                  </div>
                </article>
              ))
            )}

            <div className="space-y-6 pt-12">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight text-kc-on-surface">Client Reviews</h3>
                {reviewsTotal > reviews.length && (
                  <span className="text-kc-on-surface-variant/70 text-xs font-bold uppercase tracking-widest">
                    Showing {reviews.length} of {reviewsTotal}
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="bg-kc-surface-container-lowest rounded-3xl border border-kc-outline-variant/30 p-12 text-center">
                  <Star className="w-10 h-10 mx-auto mb-4 text-kc-on-surface-variant opacity-40" />
                  <p className="text-kc-on-surface-variant">No reviews yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review) => {
                    const reviewerName = getUserDisplayName(review.user)
                    const reviewerInitial = reviewerName.charAt(0).toUpperCase() || '?'
                    const stars = Math.max(0, Math.min(5, Number(review.rating) || 0))
                    return (
                      <div key={review.id} className="bg-kc-surface-container-lowest p-8 rounded-3xl border border-kc-outline-variant/30 shadow-sm">
                        <div className="flex gap-1 mb-4 text-kc-primary">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < stars ? 'fill-current' : 'opacity-20'}`} />
                          ))}
                        </div>
                        <p className="text-kc-on-surface-variant italic leading-relaxed mb-6 line-clamp-5">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-kc-primary/10 overflow-hidden flex items-center justify-center font-bold text-kc-primary text-xs">
                            {review.user?.profile_picture_url || review.user?.profile_picture ? (
                              <img
                                alt={reviewerName}
                                src={review.user.profile_picture_url || review.user.profile_picture}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              reviewerInitial
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-kc-on-surface">{reviewerName}</span>
                            {review.listing_name && (
                              <span className="text-[10px] uppercase tracking-widest font-bold text-kc-on-surface-variant/60">
                                {review.listing_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-10">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight text-kc-on-surface">Live Fleet</h3>
                <Link
                  href={`/${locale}/search?partner=${partnerId}`}
                  className="text-kc-primary text-xs font-bold uppercase tracking-widest border-b border-kc-primary/20 pb-0.5"
                >
                  All Assets
                </Link>
              </div>

              <div className="space-y-6">
                {listings.length === 0 && (
                  <p className="text-kc-on-surface-variant/70 text-sm">No vehicles currently available in the fleet.</p>
                )}
                {listings.slice(0, 3).map((car) => {
                  const carImage = car.images?.[0]?.image_url || car.images?.[0]?.image || (typeof car.images?.[0] === 'string' ? car.images[0] : null)
                  const carName = [car.brand || car.make, car.model].filter(Boolean).join(' ') || car.name || 'Vehicle'
                  return (
                    <Link
                      key={car.id}
                      href={`/${locale}/car/${car.id}`}
                      className="block group bg-kc-surface-container-lowest rounded-3xl overflow-hidden border border-kc-outline-variant/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="h-48 overflow-hidden relative bg-kc-surface-container-high">
                        {carImage ? (
                          <img alt={carName} className="w-full h-full object-cover" src={carImage} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-kc-on-surface-variant/40">No image</div>
                        )}
                        {car.price_per_day && (
                          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl font-bold text-sm">
                            {formatPrice(car.price_per_day)}
                            <span className="text-[10px] text-slate-300 ml-1">/day</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h5 className="font-bold text-lg text-kc-on-surface mb-4">{carName}</h5>
                        <div className="flex gap-4 mb-6">
                          {car.transmission && (
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-kc-on-surface-variant/70">
                              <Settings className="w-3 h-3" />
                              {car.transmission === 'automatic' ? 'Auto' : 'Manual'}
                            </div>
                          )}
                          {car.horsepower && (
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-kc-on-surface-variant/70">
                              <Bolt className="w-3 h-3" />
                              {car.horsepower}hp
                            </div>
                          )}
                        </div>
                        <span className="block w-full py-3 bg-kc-on-surface text-white rounded-xl font-bold text-xs uppercase tracking-widest text-center group-hover:bg-kc-primary transition-all">
                          View Vehicle
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <Footer />

      <ComposeRequestModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        prefillPartnerId={partner?.id}
        prefillPartnerName={companyName}
        onCreated={() => {
          setComposeOpen(false)
          showToast?.('Request sent. Track it in your messages.', 'success')
        }}
      />
    </div>
  )
}
