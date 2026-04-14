import PartnerProfileClient from './PartnerProfileClient'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

async function fetchPartner(slug) {
  try {
    let id = slug
    if (isNaN(Number(slug))) {
      const listRes = await fetch(`${API_BASE_URL}/partners/`, {
        next: { revalidate: 300 },
      })
      if (!listRes.ok) return null
      const listJson = await listRes.json()
      const partners = listJson?.data || listJson || []
      const match = partners.find(
        (p) =>
          p.slug === slug ||
          p.business_name?.toLowerCase().replace(/\s+/g, '-') === String(slug).toLowerCase() ||
          String(p.id) === String(slug)
      )
      if (!match) return null
      id = match.id
    }

    const res = await fetch(`${API_BASE_URL}/partners/${id}/`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || json || null
  } catch {
    return null
  }
}

function stripTrailingQuery(url) {
  return url ? url.replace(/\?$/, '') : null
}

export async function generateMetadata({ params }) {
  const { slug, locale } = await params
  const partner = await fetchPartner(slug)

  if (!partner) {
    return {
      title: 'Partner not found | Airbcar',
      description: 'This partner profile is not available.',
    }
  }

  const companyName =
    partner.business_name ||
    partner.company_name ||
    [partner.user?.first_name, partner.user?.last_name].filter(Boolean).join(' ') ||
    'Partner'
  const fleetCount =
    (Array.isArray(partner.listings) && partner.listings.length) ||
    (Array.isArray(partner.vehicles) && partner.vehicles.length) ||
    0
  const reviewCount = partner.review_count || 0
  const rating = Number(partner.rating || 0).toFixed(1)

  const title = `${companyName} on Airbcar${fleetCount ? ` — ${fleetCount} cars` : ''}`
  const description =
    partner.description ||
    partner.bio ||
    `Rent cars from ${companyName} on Airbcar. ${fleetCount} vehicles, ${reviewCount} reviews, ${rating}★ rating.`

  const image = stripTrailingQuery(
    partner.cover_image ||
      partner.coverUrl ||
      partner.logo_url ||
      partner.logo ||
      partner.user?.profile_picture_url ||
      partner.user?.profile_picture ||
      null
  )

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/partner/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/${locale}/partner/${slug}`,
      siteName: 'Airbcar',
      images: image ? [{ url: image, alt: companyName }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function PartnerProfilePage({ params }) {
  const { slug } = await params
  const partner = await fetchPartner(slug)
  const initialListings = partner?.listings || partner?.vehicles || []

  return (
    <PartnerProfileClient
      initialPartner={partner}
      initialListings={initialListings}
    />
  )
}
