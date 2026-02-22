import { Suspense } from 'react';
import { Metadata } from 'next';
import HomeContent from "@/features/home/components/HomeContent";

// Export metadata for this page
export const metadata = {
  title: "Airbcar - Car Rental Morocco | Luxury & Affordable Vehicle Rentals",
  description: "Rent a car in Morocco with Airbcar. Best prices on luxury and economy vehicles. Same-day delivery, 24/7 support. Book your car today.",
  keywords: "car rental Morocco, rent car Morocco, car hire Casablanca, luxury car rental, affordable car rental",
  openGraph: {
    title: "Airbcar - Morocco's Best Car Rental Service",
    description: "Rent a car in Morocco with Airbcar. Best prices on luxury and economy vehicles.",
    type: "website",
    images: [
      {
        url: "https://airbcar.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Airbcar - Car Rental Morocco",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Airbcar - Car Rental Morocco",
    description: "Best car rental service in Morocco",
  },
};

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}