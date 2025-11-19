import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BackButton from './BackButton'
import OwnerSpotlight from './components/OwnerSpotlight'
import TrustIndicators from './components/TrustIndicators'
import FleetSection from './components/FleetSection'
import { fetchPartnerProfile } from './api'
import { computeFleetInsights } from './utils'
import PageTransition from './PageTransition'

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params
    const partner = await fetchPartnerProfile(slug)
    
    if (!partner) {
      return {
        title: 'Partner not found | AirbCar',
      }
    }
    
    return {
      title: `${partner.company_name} | AirbCar partner`,
      description:
        partner.description ||
        `Discover vehicles offered by ${partner.company_name}`,
      openGraph: {
        title: partner.company_name,
        description: partner.description,
        type: 'website',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/partner/${partner.slug}`,
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
    
    if (!partner) {
      notFound()
    }
    
    const listings = partner.listings ?? []
    const { minPrice, maxRating, locationCount } = computeFleetInsights(listings)

    return (
      <PageTransition>
        <div className="min-h-screen bg-neutral-50">
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
            <BackButton />

            <section className="mt-12 grid gap-6 lg:grid-cols-[2fr,1fr]">
              <OwnerSpotlight partner={partner} />
            </section>

            <TrustIndicators companyName={partner.company_name} />

            <FleetSection listings={listings} />
          </main>
          <Footer />
        </div>
      </PageTransition>
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
