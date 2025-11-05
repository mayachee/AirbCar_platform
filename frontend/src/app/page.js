'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CarTypes from "@/features/home/components/CarTypes";
import Features from "@/features/home/components/Features";
import Header from "@/components/layout/Header";
import Hero from "@/features/home/components/Hero";
import HowItWorks from "@/features/home/components/HowItWorks";
import PopularDestinations from "@/features/home/components/PopularDestinations";
import Footer from "@/components/layout/Footer";
import TrustSignals from "@/features/home/components/TrustSignals";
import RentalProviders from "@/features/home/components/RentalProviders";
import InfoSection from "@/features/home/components/InfoSection";

function HomeContent() {
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
      <Header />
      <Hero />
      <Features />
      <PopularDestinations />
      <CarTypes />
      <TrustSignals />
      <RentalProviders />
      <HowItWorks />
      <InfoSection />
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}