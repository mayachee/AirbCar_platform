import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

// Use NEXT_PUBLIC_ prefix for server-side rendering compatibility
// For server-side fetch in Next.js, use localhost which works better than 127.0.0.1
const API_BASE_URL =
  process.env.NEXT_PUBLIC_DJANGO_API_URL ||
  process.env.DJANGO_API_URL ||
  'http://localhost:8000'

async function fetchPartnerProfile(slugOrId) {
  const url = `${API_BASE_URL}/api/partners/public/${slugOrId}/`
  
  try {
    console.log(`[PartnerPage] Fetching partner from: ${url}`)
    
    // Use the public partners endpoint which uses PublicPartnerSerializer
    // This endpoint is designed for public viewing and accepts both numeric ID and slug
    const response = await fetch(url, {
      // Revalidate periodically so public data stays fresh but cached (3 minutes)
      next: { revalidate: 180 },
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[PartnerPage] API error: ${response.status} - ${errorText}`)
      
      if (response.status === 404) {
        notFound()
      }

      throw new Error(
        `Failed to load partner profile: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    console.log(`[PartnerPage] Successfully fetched partner: ${data.company_name || slugOrId}`)
    
    // Log image information for debugging
    if (data.listings && Array.isArray(data.listings)) {
      const listingsWithImages = data.listings.filter(l => l.pictures && l.pictures.length > 0)
      console.log(`[PartnerPage] Partner has ${listingsWithImages.length} listings with images out of ${data.listings.length} total listings`)
      listingsWithImages.forEach((listing, idx) => {
        console.log(`[PartnerPage] Listing ${idx + 1}: ${listing.pictures.length} images`, listing.pictures)
      })
    }
    if (data.logo) {
      console.log(`[PartnerPage] Partner logo: ${data.logo}`)
    }
    if (data.user?.profile_picture) {
      console.log(`[PartnerPage] Owner profile picture: ${data.user.profile_picture}`)
    }
    
    return data
  } catch (error) {
    console.error('[PartnerPage] Error fetching partner profile:', {
      url,
      error: error.message,
      name: error.name,
      cause: error.cause,
    })
    
    // If it's a network error, provide helpful message
    if (error.name === 'AbortError' || error.message.includes('fetch failed')) {
      throw new Error(
        `Failed to connect to backend API. Please ensure the backend server is running at ${API_BASE_URL}`
      )
    }
    
    // Re-throw with more context
    throw new Error(`Failed to fetch partner profile: ${error.message}`)
  }
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params
    const partner = await fetchPartnerProfile(slug)
    return {
      title: `${partner.company_name} | AirbCar partner`,
      description:
        partner.description ||
        `Discover vehicles offered by ${partner.company_name}`,
      openGraph: {
        title: partner.company_name,
        description: partner.description,
        type: 'website',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/partner/${partner.slug}`,
        images: partner.logo
          ? [
              {
                url: partner.logo,
                width: 1200,
                height: 630,
                alt: `${partner.company_name} logo`,
              },
            ]
          : undefined,
      },
    }
  } catch (error) {
    return {
      title: 'Partner not found | AirbCar',
    }
  }
}

export default async function PartnerPublicProfilePage({ params }) {
  try {
    const { slug } = await params
    if (!slug) {
      notFound()
    }

    const partner = await fetchPartnerProfile(slug)
    const listings = partner.listings ?? []
    
    // Find the first available image from listings or use partner logo
    // Look through all listings to find the first one with valid image URLs
    let heroImage = null
    
    // First try partner logo if it exists and is a valid URL
    if (partner.logo && typeof partner.logo === 'string' && partner.logo.trim().length > 0) {
      heroImage = partner.logo.trim()
    }
    
    // If no logo, look through all listings for the first valid image
    if (!heroImage && listings.length > 0) {
      for (const listing of listings) {
        if (listing.pictures && Array.isArray(listing.pictures) && listing.pictures.length > 0) {
          // Find first valid image URL
          const validImage = listing.pictures.find(
            pic => pic && typeof pic === 'string' && pic.trim().length > 0
          )
          if (validImage) {
            heroImage = validImage.trim()
            break
          }
        }
      }
    }
    
    const { minPrice, maxRating, locationCount } = computeFleetInsights(listings)

    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-orange-600 transition hover:text-orange-700"
        >
          ← Back to home
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="grid gap-8 p-8 md:grid-cols-[320px,1fr] md:p-12">
            <div className="space-y-6">
              <div className="relative h-56 w-full overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-inner">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={`${partner.company_name} hero image`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 320px, 100vw"
                    priority
                    unoptimized={heroImage.includes('supabase.co')}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-semibold text-neutral-300">
                    {partner.company_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              <ContactCard partner={partner} />
            </div>

            <div className="flex flex-col gap-8">
              <header>
                <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                  Trusted mobility partner
                </span>
                <h1 className="mt-2 text-3xl font-semibold text-neutral-900 md:text-4xl">
                  {partner.company_name}
                </h1>

                {/* Business type and location */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {partner.business_type && (
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                      {partner.business_type}
                    </span>
                  )}
                  {partner.city && (
                    <span className="inline-flex items-center text-sm text-neutral-600">
                      <svg
                        className="mr-1.5 h-4 w-4 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {partner.city}
                    </span>
                  )}
                </div>

                {partner.description && (
                  <p className="mt-4 text-base leading-7 text-neutral-600">
                    {partner.description}
                  </p>
                )}

                <dl className="mt-8 grid gap-6 sm:grid-cols-3">
                  <StatItem
                    label="Cars available"
                    value={partner.total_listings ?? 0}
                  />
                  <StatItem
                    label="Average rating"
                    value={
                      typeof partner.average_rating === 'number'
                        ? partner.average_rating.toFixed(1)
                        : '–'
                    }
                  />
                  <StatItem
                    label="Joined"
                    value={new Date(
                      partner.created_at
                    ).toLocaleDateString()}
                  />
                </dl>
              </header>

              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Why ride with this partner?
                </h2>
                <WhyRide partner={partner} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <FleetInsights
            minPrice={minPrice}
            maxRating={maxRating}
            locationCount={locationCount}
            vehicleCount={listings.length}
          />
          <OwnerSpotlight partner={partner} />
        </section>

        <section className="mt-12 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Fleet highlights
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Explore popular vehicles available from this partner.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            >
              Search all vehicles
            </Link>
          </div>

          {partner.listings?.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {partner.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyListingsState />
          )}
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-10 text-white shadow-lg">
          <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold leading-tight">
                Interested in partnering with AirbCar?
              </h2>
              <p className="mt-3 max-w-3xl text-sm text-orange-50/90">
                Reach thousands of drivers looking for reliable, beautifully
                maintained vehicles. We handle the tech, marketing and bookings
                so you can focus on delighting customers.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/partner"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  Become a partner
                </Link>
                <a
                  href="mailto:partners@airbcar.com"
                  className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Talk to our team
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/10 p-6 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">
                Why teams choose AirbCar
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-orange-50/90">
                <li>• Dedicated account manager</li>
                <li>• Insurance integration support</li>
                <li>• Real-time booking dashboard</li>
                <li>• Automated payouts & invoicing</li>
              </ul>
            </div>
          </div>
        </section>
        </main>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error('Error in PartnerPublicProfilePage:', error)
    // If it's a 404, let notFound() handle it
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      notFound()
    }
    // Re-throw other errors so Next.js can handle them
    throw error
  }
}

function StatItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold text-neutral-900">{value}</dd>
    </div>
  )
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm">
      {children}
    </span>
  )
}

function ContactCard({ partner }) {
  return (
    <aside className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">
        Contact information
      </h2>
      <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
        Reach out directly for pickup details or special requests.
      </p>
      <dl className="mt-4 space-y-3">
        {partner.company_name && (
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Company</dt>
            <dd className="font-medium text-neutral-900">
              {partner.company_name}
            </dd>
          </div>
        )}
        {partner.business_type && (
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Business type</dt>
            <dd className="font-medium text-neutral-900 capitalize">
              {partner.business_type}
            </dd>
          </div>
        )}
        {partner.city && (
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Location</dt>
            <dd className="font-medium text-neutral-900">
              {partner.city}
              {partner.address && `, ${partner.address}`}
            </dd>
          </div>
        )}
        {partner.phone && (
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Phone</dt>
            <dd>
              <a
                href={`tel:${partner.phone}`}
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                {partner.phone}
              </a>
            </dd>
          </div>
        )}
        {partner.website && (
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Website</dt>
            <dd>
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                Visit site
              </a>
            </dd>
          </div>
        )}
        {partner.address && (
          <div className="flex items-start justify-between gap-4">
            <dt className="mt-[2px] text-neutral-500">Address</dt>
            <dd className="text-right">{partner.address}</dd>
          </div>
        )}
        <div className="flex items-start justify-between">
          <dt className="mt-[2px] text-neutral-500">Status</dt>
          <dd>
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              {partner.verification_status === 'approved'
                ? 'Verified partner'
                : 'In review'}
            </span>
          </dd>
        </div>
      </dl>
    </aside>
  )
}

function ListingCard({ listing }) {
  // Get the first valid image URL from pictures array
  const pictures = Array.isArray(listing.pictures) ? listing.pictures : []
  const coverImage = pictures.find(
    pic => pic && typeof pic === 'string' && pic.trim().length > 0 && (pic.startsWith('http://') || pic.startsWith('https://'))
  )?.trim() || null
  
  const sanitizedLocation = listing.location?.trim()
  
  // Format price - handle both string and number
  let formattedPrice = '—'
  if (listing.price_per_day) {
    const price = typeof listing.price_per_day === 'number' 
      ? listing.price_per_day 
      : parseFloat(String(listing.price_per_day))
    if (!isNaN(price) && isFinite(price)) {
      formattedPrice = `€${price.toFixed(2)}`
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-52 w-full bg-neutral-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={`${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim() || 'Vehicle image'}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={false}
            unoptimized={coverImage.includes('supabase.co')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <div className="text-center">
              <div className="text-4xl mb-2 font-semibold">{listing.make?.[0]?.toUpperCase() || '?'}</div>
              <div className="text-xs">No image available</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {listing.year} {listing.make} {listing.model}
          </h3>
          {sanitizedLocation && (
            <p className="text-sm text-neutral-500">{sanitizedLocation}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>
            <span className="text-lg font-semibold text-neutral-900">
              {formattedPrice}
            </span>{' '}
            / day
          </span>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
            Rating: {listing.rating ?? '–'}
          </span>
        </div>

        <Link
          href={`/car/${listing.id}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
        >
          View details
        </Link>
      </div>
    </article>
  )
}

function EmptyListingsState() {
  return (
    <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center text-neutral-500">
      <h3 className="text-lg font-medium text-neutral-700">
        No cars listed yet
      </h3>
      <p className="mt-2 text-sm text-neutral-500">
        Check back soon to see the vehicles this partner offers or contact them
        directly for availability.
      </p>
    </div>
  )
}

function WhyRide({ partner }) {
  const highlights = [
    'Transparent pricing with no hidden fees',
    'Professionally maintained vehicles with routine inspections',
    'Flexible pickup options tailored to your itinerary',
    'Friendly support team for custom requests and special events',
  ]

  return (
    <>
      <p className="mt-3 text-sm text-neutral-600">
        Our partners are carefully vetted to ensure high service quality,
        transparent pricing, well-maintained vehicles and responsive customer
        care. Book with confidence and enjoy a seamless rental experience from
        pickup to drop-off.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-neutral-600">
        {highlights.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-[6px] inline-block h-2 w-2 rounded-full bg-orange-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-neutral-600">
        <Badge>Flexible cancellation</Badge>
        <Badge>Verified fleet</Badge>
        <Badge>24/7 support</Badge>
        <Badge>Contactless pickup</Badge>
      </div>
    </>
  )
}

function FleetInsights({
  minPrice,
  maxRating,
  locationCount,
  vehicleCount,
}) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">
        Fleet at a glance
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        Snapshot of this partner&rsquo;s availability based on live listings.
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <InsightStat label="Vehicles ready" value={vehicleCount} />
        <InsightStat label="Starting from" value={minPrice ? `€${minPrice}` : '–'} />
        <InsightStat label="Top customer rating" value={maxRating ?? '–'} />
        <InsightStat
          label="Pickup areas"
          value={locationCount}
        />
      </dl>
      <p className="mt-6 rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-500">
        Availability can change quickly—secure your dates early for the best
        selection of vehicles.
      </p>
    </section>
  )
}

function OwnerSpotlight({ partner }) {
  const ownerName =
    [partner?.user?.first_name, partner?.user?.last_name]
      .filter(Boolean)
      .join(' ') || 'Partner'
  const ownerInitials = ownerName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const ownerImage = partner?.user?.profile_picture ?? null

  return (
    <aside className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">
        Owner spotlight
      </h2>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 shadow-inner">
          {ownerImage && typeof ownerImage === 'string' && ownerImage.trim().length > 0 && (ownerImage.startsWith('http://') || ownerImage.startsWith('https://')) ? (
            <Image
              src={ownerImage.trim()}
              alt={`${ownerName} profile picture`}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized={ownerImage.includes('supabase.co')}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-400">
              {ownerInitials || 'P'}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{ownerName}</p>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Partner since{' '}
            {new Date(partner.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-neutral-600">
        {ownerName} personally oversees each booking to ensure a smooth,
        premium experience. Get in touch for custom itineraries, corporate
        travel or special events.
      </p>
      <div className="mt-6 space-y-3 text-sm text-neutral-600">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Service commitments
          </p>
          <ul className="mt-3 space-y-2">
            <li>• Timely pick-up coordination and flexible drop-off windows</li>
            <li>• Vehicles fully sanitized and inspected before each rental</li>
            <li>• Local insights and route suggestions upon request</li>
          </ul>
        </div>
        <p className="text-xs text-neutral-500">
          Have a question before booking? Reach out using the contact
          information above—we respond quickly to ensure your trip stays on
          schedule.
        </p>
      </div>
    </aside>
  )
}

function InsightStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-2 text-xl font-semibold text-neutral-900">{value}</dd>
    </div>
  )
}

function computeFleetInsights(listings) {
  if (!Array.isArray(listings) || !listings.length) {
    return { minPrice: null, maxRating: null, locationCount: 0 }
  }

  // Parse price_per_day - can be string or number
  const prices = listings
    .map((listing) => {
      const price = listing.price_per_day
      if (typeof price === 'number') return price
      if (typeof price === 'string') {
        const parsed = parseFloat(price)
        return isNaN(parsed) ? null : parsed
      }
      return null
    })
    .filter((price) => price !== null && !Number.isNaN(price))
  
  // Parse ratings - can be string or number
  const ratings = listings
    .map((listing) => {
      const rating = listing.rating
      if (typeof rating === 'number') return rating
      if (typeof rating === 'string') {
        const parsed = parseFloat(rating)
        return isNaN(parsed) ? null : parsed
      }
      return null
    })
    .filter((rating) => rating !== null && !Number.isNaN(rating))
  
  const locations = new Set(
    listings
      .map((listing) => listing.location?.trim())
      .filter(Boolean)
  )

  return {
    minPrice: prices.length ? Math.min(...prices) : null,
    maxRating: ratings.length ? Math.max(...ratings).toFixed(1) : null,
    locationCount: locations.size,
  }
}