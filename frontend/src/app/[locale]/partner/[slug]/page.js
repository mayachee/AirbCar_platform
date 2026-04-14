'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, MapPin, TrendingUp, Sparkles, Calendar, Phone, Mail, Car, Award, Share2, Heart, MessageCircle, Bookmark, Settings, Bolt } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BackButton from './BackButton'
import AnimatedBreadcrumb from './components/AnimatedBreadcrumb'
import OwnerSpotlight from './components/OwnerSpotlight'
import FleetSection from './components/FleetSection'
import { fetchPartnerProfile } from './api'
import { computeFleetInsights } from './utils'
import { useCurrency } from '@/contexts/CurrencyContext'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

export default function PartnerPublicProfilePage() {
  const params = useParams()
  const { formatPrice } = useCurrency()
  const t = useTranslations('partner_public')
  const [partner, setPartner] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadPartner = async () => {
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
        
        // Handle nested data structure
        const actualPartner = partnerData?.data || partnerData
        const partnerListings = actualPartner?.listings || actualPartner?.vehicles || []
        
        setPartner(actualPartner)
        setListings(partnerListings)
        
        // Update page title
        const companyName = actualPartner?.business_name || actualPartner?.company_name || actualPartner?.companyName || 'Partner'
        document.title = `${companyName} | AirbCar Partner`
      } catch (err) {
        console.error('Error loading partner:', err)
        setError(err.message || 'Failed to load partner')
      } finally {
        setLoading(false)
      }
    }

    loadPartner()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-kc-surface">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <div className="relative inline-flex">
              <div className="w-16 h-16 border-4 border-kc-primary/30 rounded-3xl animate-spin border-t-kc-primary"></div>
            </div>
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
              <div className="w-16 h-16 bg-kc-error/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
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

  const { minPrice, maxRating, locationCount } = computeFleetInsights(listings)
  
  // Extract partner data for display
  const partnerData = partner?.data || partner || {}
  const companyName = partnerData?.business_name || partnerData?.company_name || partnerData?.companyName || 'Partner'
  const description = partnerData?.description || partnerData?.bio || 'Curating elite performance and luxury mobility across the globe.'
  const location = partnerData?.location || partnerData?.city || partnerData?.user?.city
  const phone = partnerData?.phone || partnerData?.phone_number || partnerData?.user?.phone_number
  const email = partnerData?.email || partnerData?.user?.email
  const totalBookings = partnerData?.total_bookings || 0
  const reviewCount = partnerData?.review_count || 0
  const rating = partnerData?.rating || 0

  const coverUrl = partnerData?.cover_image || partnerData?.coverUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ3ki7yHxvYvJTCocSa5Sm2FNBRBXVeBLg221yxD89hErlpkbC8HkornIY--JnDUdwUCMOmaUs61uVh6p2NsH7I91Nbcf9q4fjtDS9bHdtARWr_4ZYyR7r0ZVfKUB_79Gn7HyOvCNXKZ7rxoSbfcBgMCKir9PuM0FND4fuA6rDlqanu6BQZfbKlUxjf4NKpU6W9UbyF3ftI675xi4Sa1XXtQfZ4-Ur1zeaRBPA4elSRQWFO6qUPYTJXLoYf1KRxO765DbPyMhKA2I"
  const logoUrl = partnerData?.logo || partnerData?.profile_image || partnerData?.user?.profile_picture || "https://lh3.googleusercontent.com/aida-public/AB6AXuDLXehMLNX8QNR84qihA7ZKLnm_o_1zHT7br_WGmUOIzEvTXo_tmrBh5NGRqj7zFTS6Tu948bP_QeiZ8zYTEOjSz0hiEDQk6FZIImPvduA78LMHLCu_AHfKTmTmu3MFGlGKyhnY3PanKWAwMmUlgzjTaz-ctCmoAQNgGk0SNB42k3BxDZwPoluAYQ8PkWDiJymzy6ghxJ5uln2Y26BmNpiLWFSepPmGcBM-4Jh2Vd8FCyfGQPN8CBkoHdoR_LguzascwcvzQ710KhU"

  return (
    <div className="min-h-screen bg-kc-surface text-kc-on-surface">
      <Header />
      
      <main className="min-h-screen pb-20">
        <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* Hero Banner */}
          <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl">
            <img 
              alt={`${companyName} Cover`} 
              className="w-full h-full object-cover" 
              src={coverUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row items-end justify-between gap-6">
              <div className="flex items-end gap-6">
                <div className="w-32 h-32 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-2xl shrink-0">
                  <img 
                    alt={`${companyName} Logo`} 
                    className="w-full h-full object-cover" 
                    src={logoUrl}
                  />
                </div>
                <div className="pb-2 text-white">
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl font-black tracking-tighter">{companyName}</h2>
                    <Award className="text-kc-primary w-7 h-7 fill-kc-primary" />
                  </div>
                  <p className="text-slate-200 font-medium text-lg mt-1 max-w-xl line-clamp-2">{description}</p>
                </div>
              </div>
              
              <div className="flex gap-3 pb-2">
                <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/20 transition-all">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
                <button className="bg-kc-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-kc-primary/30 hover:scale-105 active:scale-95 transition-all">
                  Follow
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-kc-surface-container-lowest p-8 rounded-3xl shadow-sm border border-kc-outline-variant/30 flex flex-col items-center text-center">
              <span className="text-4xl font-black text-kc-primary tracking-tighter">{totalBookings > 0 ? `${totalBookings}+` : '0'}</span>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-kc-on-surface-variant/70 mt-2">Total Journeys</span>
            </div>
            <div className="bg-kc-surface-container-lowest p-8 rounded-3xl shadow-sm border border-kc-outline-variant/30 flex flex-col items-center text-center">
              <span className="text-4xl font-black text-kc-on-surface tracking-tighter">{listings.length}</span>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-kc-on-surface-variant/70 mt-2">Active Fleet Size</span>
            </div>
            <div className="bg-kc-surface-container-lowest p-8 rounded-3xl shadow-sm border border-kc-outline-variant/30 flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-kc-on-surface tracking-tighter">{rating.toFixed(1)}</span>
                <Star className="text-kc-primary w-8 h-8 fill-kc-primary" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-kc-on-surface-variant/70 mt-2">Client Rating ({reviewCount})</span>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-black tracking-tight text-kc-on-surface">Featured Threads</h3>
              <div className="flex gap-4">
                <button className="text-kc-primary font-bold text-sm">Latest</button>
                <button className="text-kc-on-surface-variant/70 font-bold text-sm hover:text-kc-on-surface">Trending</button>
              </div>
            </div>

            {/* Post 1 Placeholder matching mockup */}
            <article className="bg-kc-surface-container-lowest rounded-[2rem] border border-kc-outline-variant/30 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-50">
                    <img alt="Avatar" src={logoUrl} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-kc-on-surface">{companyName}</h4>
                    <p className="text-xs text-kc-on-surface-variant/70 font-medium">2 hours ago • Featured Arrival</p>
                  </div>
                </div>
                <p className="text-lg leading-relaxed text-kc-on-surface-variant mb-8">
                  The future of performance has arrived. Our first <span className="text-kc-primary font-bold">Porsche Taycan Turbo S</span> is now ready for your next weekend escape. Experience 0-60 in 2.6 seconds of silent fury.
                </p>
                <div className="rounded-2xl overflow-hidden aspect-[16/9] mb-8 relative">
                  <img 
                    alt="Taycan" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5mE-XpXIlwTnOL8yc8QxrLpqeWtuMTv2HySVkzfrEGbUzcyXFT8ghk5EKSUbXDE61YjTDJDPb35gyYaqITCAYU_gh8xNV_ukzYMn1Bf_x705QwNWnUM5oIszzVUKtQSvaHhqXwlKp36NJjO67J9IPQMutpZIOntE20DBMKshZ211hG5_dRLAPGLsfe3O6s2lfTh2syeFk--lT1m__iHOjDRtOOW2KiCmArarZMcgo-bYapLbJuc-DuVgaEeBK5AELgpV0AIy2Oc4"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-kc-on-surface shadow-sm">
                    New Arrival
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-kc-outline-variant/20">
                  <div className="flex items-center gap-8">
                    <button className="flex items-center gap-2 text-kc-on-surface-variant/70 hover:text-kc-primary transition-colors">
                      <Heart className="w-6 h-6" />
                      <span className="text-sm font-bold">128</span>
                    </button>
                    <button className="flex items-center gap-2 text-kc-on-surface-variant/70 hover:text-kc-primary transition-colors">
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-sm font-bold">24</span>
                    </button>
                    <button className="flex items-center gap-2 text-kc-on-surface-variant/70 hover:text-kc-primary transition-colors">
                      <Bookmark className="w-6 h-6" />
                      <span className="text-sm font-bold">Save</span>
                    </button>
                  </div>
                  <button className="bg-kc-on-surface text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-kc-primary transition-all">Book Now</button>
                </div>
                {/* Comment placeholder */}
                <div className="mt-8 p-6 bg-kc-surface-container-low rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <img 
                      alt="User" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIPUI_iQCQeAg3BuulhyhPA48-GCXjvnaKYkSX6NvPezimgK_Y4E51iISKemtCgs02WfvThSwAVLkGfroe1gCrflc55B61x-u5EqnOw3HNkt7yrzmByMGS3NiZhpCP535Tm1BXhCPkpf_o8Wch5D78_15R5vldOI1YkuuAWxpfY3qGY9vMi_HqXoNXpsiDDUEh7Gb3nZWrmPFrJSsEYNiU0zS59hk9O-v28jDQIQO2N13gqiM4uIizEq3TTUuofKIQ069M6CiJV-k"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-kc-on-surface">Marcus Chen</h5>
                    <p className="text-sm text-kc-on-surface-variant mt-1">Booked it for next Friday. Can't wait to see if the range holds up on the coastal drive! ⚡️</p>
                  </div>
                </div>
              </div>
            </article>

            {/* Testimonials */}
            <div className="space-y-6 pt-12">
              <h3 className="text-2xl font-black tracking-tight text-kc-on-surface">Elite Experiences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-kc-surface-container-lowest p-8 rounded-3xl border border-kc-outline-variant/30 shadow-sm">
                  <div className="flex gap-1 mb-4 text-kc-primary">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-kc-on-surface-variant italic leading-relaxed mb-6">"Absolute seamless experience from pickup to drop-off. The {companyName} team knows how to treat their clients. The G-Wagon was immaculate."</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-kc-primary/10 flex items-center justify-center font-bold text-kc-primary text-xs">JV</div>
                    <span className="font-bold text-sm text-kc-on-surface">Julian V., Enterprise CEO</span>
                  </div>
                </div>
                <div className="bg-kc-surface-container-lowest p-8 rounded-3xl border border-kc-outline-variant/30 shadow-sm">
                  <div className="flex gap-1 mb-4 text-kc-primary">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-kc-on-surface-variant italic leading-relaxed mb-6">"I appreciate the attention to detail. The route planning they provided with the rental made our anniversary trip unforgettable."</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-kc-primary/10 flex items-center justify-center font-bold text-kc-primary text-xs">SK</div>
                    <span className="font-bold text-sm text-kc-on-surface">Sarah K., Creative Director</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight text-kc-on-surface">Live Fleet</h3>
                <a className="text-kc-primary text-xs font-bold uppercase tracking-widest border-b border-kc-primary/20 pb-0.5" href="#">All Assets</a>
              </div>
              
              <div className="space-y-6">
                {listings.slice(0, 3).map((car, index) => (
                  <div key={car.id || index} className="group bg-kc-surface-container-lowest rounded-3xl overflow-hidden border border-kc-outline-variant/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        alt={`${car.make} ${car.model}`} 
                        className="w-full h-full object-cover" 
                        src={car.images?.[0]?.image_url || "https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=800"} 
                      />
                      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl font-bold text-sm">
                        {formatPrice(car.price_per_day)}<span className="text-[10px] text-slate-300 ml-1">/day</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h5 className="font-bold text-lg text-kc-on-surface mb-4">{car.brand} {car.model}</h5>
                      <div className="flex gap-4 mb-6">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-kc-on-surface-variant/70">
                          <Settings className="w-3 h-3" />
                          {car.transmission === 'automatic' ? 'Auto' : 'Manual'}
                        </div>
                        {car.horsepower && (
                          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-kc-on-surface-variant/70">
                            <Bolt className="w-3 h-3" />
                            {car.horsepower}hp
                          </div>
                        )}
                      </div>
                      <button className="w-full py-3 bg-kc-on-surface text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-kc-primary transition-all">Rent Vehicle</button>
                    </div>
                  </div>
                ))}
                
                {listings.length === 0 && (
                  <p className="text-kc-on-surface-variant/70 text-sm">No vehicles currently available in the fleet.</p>
                )}
              </div>

              <div className="mt-10 p-8 rounded-3xl bg-kc-inverse-surface text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-green-400 font-bold text-xs uppercase tracking-widest">Concierge Online</span>
                  </div>
                  <h4 className="text-xl font-bold mb-2">Need Assistance?</h4>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">Our dedicated concierge team is ready to curate your bespoke itinerary.</p>
                  <button className="w-full py-3 bg-kc-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all">Start Chat</button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-kc-primary/20 rounded-full blur-3xl"></div>
              </div>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}

