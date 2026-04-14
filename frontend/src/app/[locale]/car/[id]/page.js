import CarDetailClient from './CarDetailClient'

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

export async function generateMetadata({ params }) {
  const { id, locale } = await params
  const vehicle = await fetchVehicle(id)

  if (!vehicle) {
    return {
      title: 'Car not found | Airbcar',
      description: 'This vehicle is not available.',
    }
  }

  const name =
    vehicle.name ||
    [vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
    'Rental car'
  const location = vehicle.location || vehicle.city || ''
  const price = vehicle.price || vehicle.price_per_day || vehicle.dailyRate
  const priceLabel = price ? ` — from ${price} MAD/day` : ''
  const title = `${name}${location ? ` in ${location}` : ''}${priceLabel} | Airbcar`
  const description =
    vehicle.description ||
    `Rent ${name}${location ? ` in ${location}` : ''} on Airbcar. Verified hosts, transparent pricing, instant booking.`

  const firstImage =
    vehicle.images?.[0]?.image ||
    vehicle.images?.[0]?.url ||
    (typeof vehicle.images?.[0] === 'string' ? vehicle.images[0] : null) ||
    vehicle.image

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/car/${id}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/${locale}/car/${id}`,
      siteName: 'Airbcar',
      images: firstImage ? [{ url: firstImage, alt: name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: firstImage ? [firstImage] : [],
    },
  }
}

export default async function CarDetailsPage({ params }) {
  const { id } = await params
  const initialVehicle = await fetchVehicle(id)
  return <CarDetailClient initialVehicle={initialVehicle} />
}
