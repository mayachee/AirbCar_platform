'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CarTypes from "@/features/home/components/CarTypes";
import Header from "@/components/layout/Header";
import Hero from "@/features/home/components/Hero";
import HowItWorks from "@/features/home/components/HowItWorks";
import PopularDestinations from "@/features/home/components/PopularDestinations";
import Footer from "@/components/layout/Footer";
import RentalProviders from "@/features/home/components/RentalProviders";
import InfoSection from "@/features/home/components/InfoSection";
import GlobeSection from "@/features/home/components/GlobeSection";

export default function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const location = searchParams.get('location');
    const pickupDate = searchParams.get('pickupDate');
    const dropoffDate = searchParams.get('dropoffDate');

    // If search parameters are present, redirect to search page
    if (location || pickupDate || dropoffDate) {
      const params = new URLSearchParams();
      if (location) params.set('location', location);
      if (pickupDate) params.set('pickupDate', pickupDate);
      if (dropoffDate) params.set('dropoffDate', dropoffDate);
      
      router.replace(`/search?${params.toString()}`);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen">
      {/* FAQ Schema for Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is the minimum age to rent a car in Morocco?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The minimum age to rent a car with Airbcar is 21 years old, with a valid driver's license held for at least 2 years."
                }
              },
              {
                "@type": "Question",
                "name": "What documents do I need to rent a car?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You'll need a valid passport or ID, a valid driver's license, and a credit card for the security deposit."
                }
              },
              {
                "@type": "Question",
                "name": "Can I get a rental car with free cancellation?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Most of our rental options offer free cancellation up to 48 hours before the pickup date."
                }
              },
              {
                "@type": "Question",
                "name": "Is insurance included in the rental price?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Basic insurance is included. We offer comprehensive insurance upgrades for complete peace of mind."
                }
              },
              {
                "@type": "Question",
                "name": "What payment methods do you accept?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We accept all major credit cards, debit cards, and bank transfers. Mobile payment options are also available."
                }
              }
            ]
          })
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://airbcar.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Search Cars",
                "item": "https://airbcar.com/search"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Booking",
                "item": "https://airbcar.com/booking"
              }
            ]
          })
        }}
      />

      <Header />
      <Hero />
      <PopularDestinations />
      <CarTypes />
      <InfoSection />
      <GlobeSection />
      <RentalProviders />
      <HowItWorks />
      <Footer />
    </div>
  );
}
