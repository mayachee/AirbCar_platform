import CommunityThreadClient from './CommunityThreadClient'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

async function fetchVehicle(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/listings/${id}/`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || json || null
  } catch {
    return null
  }
}

async function fetchComments(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/listings/${id}/comments/`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data?.results || json?.results || json?.data || json || []
  } catch {
    return []
  }
}

function stripTrailingQuery(url) {
  return url ? url.replace(/\?$/, '') : null
}

export async function generateMetadata({ params }) {
  const { id, locale } = await params
  const vehicle = await fetchVehicle(id)

  if (!vehicle) {
    return {
      title: 'Thread not found | Airbcar Community',
      description: 'This community thread is not available.',
    }
  }

  const vehicleName =
    vehicle.name ||
    [vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
    'Vehicle'
  const hostName =
    vehicle.partner?.business_name ||
    [vehicle.partner?.user?.first_name, vehicle.partner?.user?.last_name]
      .filter(Boolean)
      .join(' ') ||
    'Host'
  const title = `${vehicleName} thread by ${hostName} | Airbcar Community`
  const description =
    vehicle.description ||
    `Join the conversation about the ${vehicleName} on Airbcar. Real drivers, real routes, verified agencies.`

  const rawImage =
    vehicle.images?.[0]?.image ||
    vehicle.images?.[0]?.url ||
    (typeof vehicle.images?.[0] === 'string' ? vehicle.images[0] : null) ||
    vehicle.image
  const firstImage = stripTrailingQuery(rawImage)

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/community/${id}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/${locale}/community/${id}`,
      siteName: 'Airbcar',
      images: firstImage ? [{ url: firstImage, alt: vehicleName }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: firstImage ? [firstImage] : [],
    },
  }
}

export default async function CommunityThreadPage({ params }) {
  const { id } = await params
  const [vehicle, comments] = await Promise.all([
    fetchVehicle(id),
    fetchComments(id),
  ])

  return (
    <CommunityThreadClient
      vehicleId={id}
      initialVehicle={vehicle}
      initialComments={comments}
    />
  )
}
