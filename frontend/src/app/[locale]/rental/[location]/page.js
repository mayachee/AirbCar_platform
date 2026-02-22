import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from 'next/link';

const locationData = {
  casablanca: {
    name: "Casablanca",
    title: "Car Rental in Casablanca | Airbcar - Best Prices & Luxury Vehicles",
    description: "Rent a car in Casablanca with Airbcar. Airport pickup available, same-day delivery, competitive prices on economy and luxury vehicles.",
    keywords: "car rental Casablanca, rent car Casablanca airport, luxury car Casablanca",
    image: "https://airbcar.com/locations/casablanca.jpg",
    coordinates: { lat: 33.5731, lng: -7.5898 },
    description_long: "Casablanca is Morocco's largest city and major economic hub. With Airbcar, you can easily rent a car for exploring the city's beautiful beaches, Hassan II Mosque, and modern developments.",
    features: ["Airport Pickup", "Same-Day Delivery", "24/7 Support", "Competitive Prices"],
    carTypes: ["Economy", "SUV", "Luxury Sedans", "Family Vehicles"]
  },
  marrakech: {
    name: "Marrakech",
    title: "Car Rental in Marrakech | Airbcar - Explore Morocco's Red City",
    description: "Rent a car in Marrakech with Airbcar. Perfect for exploring Medina, Jemaa el-Fnaa square, and nearby Atlas Mountains.",
    keywords: "car rental Marrakech, rent car Marrakech, 4x4 rental Marrakech",
    image: "https://airbcar.com/locations/marrakech.jpg",
    coordinates: { lat: 31.6295, lng: -7.9811 },
    description_long: "Marrakech is a vibrant city perfect for exploring on your own terms. Rent a car from Airbcar to visit the historic medina, beautiful gardens, and nearby desert adventures.",
    features: ["Airport Pickup", "Atlas Mountain Tours", "Desert Safari Ready", "Flexible Booking"],
    carTypes: ["4x4 SUV", "Economy Cars", "Luxury Vehicles", "Family Cars"]
  },
  fez: {
    name: "Fez",
    title: "Car Rental in Fez | Airbcar - Explore Morocco's Ancient Capital",
    description: "Rent a car in Fez with Airbcar. Explore the ancient medina, tanneries, and nearby Ifrane and Meknes.",
    keywords: "car rental Fez, rent car Fez Morocco, explore Fez by car",
    image: "https://airbcar.com/locations/fez.jpg",
    coordinates: { lat: 34.0334, lng: -5.0059 },
    description_long: "Fez, Morocco's oldest imperial city, is best explored by car. Visit the historic medina, famous leather tanneries, and picturesque villages in the surrounding Rif Mountains.",
    features: ["City Tours", "Mountain Exploration", "Medina Access", "Professional Drivers"],
    carTypes: ["Economy Cars", "Compact SUV", "Sedans", "Minivans"]
  },
  agadir: {
    name: "Agadir",
    title: "Car Rental in Agadir | Airbcar - Beach & Atlas Adventures",
    description: "Rent a car in Agadir with Airbcar. Perfect for exploring beaches, coastal towns, and Anti-Atlas Mountains.",
    keywords: "car rental Agadir, rent car Agadir beach, Agadir airport car rental",
    image: "https://airbcar.com/locations/agadir.jpg",
    coordinates: { lat: 30.4278, lng: -9.5982 },
    description_long: "Agadir is Morocco's main beach destination and gateway to the Anti-Atlas Mountains. Rent a car to enjoy the beaches, nearby coastal villages, and mountain hikes.",
    features: ["Beach Access", "Airport Pickup", "Coastal Tours", "Mountain Drives"],
    carTypes: ["Beach-Ready Vehicles", "4x4 SUV", "Economy Cars", "Luxury Sedans"]
  }
};

export async function generateMetadata({ params }) {
  const location = (await params).location;
  const data = locationData[location];
  
  if (!data) return {};

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    openGraph: {
      title: data.title,
      description: data.description,
      image: data.image,
      type: "website",
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(locationData).map(location => ({
    location: location
  }));
}

export default async function LocationPage({ params }) {
  const location = (await params).location;
  const data = locationData[location];

  if (!data) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Location Not Found</h1>
          <p className="text-gray-600 mb-4">This location is not available yet.</p>
          <Link href="/search" className="text-blue-600 hover:underline">
            Back to Search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Location Schema for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": `Airbcar Car Rental - ${data.name}`,
            "image": data.image,
            "description": data.description_long,
            "url": `https://airbcar.com/rental/${location}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": data.name,
              "addressRegion": "Morocco",
              "addressCountry": "MA",
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": data.coordinates.lat,
              "longitude": data.coordinates.lng,
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "250+",
            },
            "sameAs": [
              "https://www.facebook.com/airbcar",
              "https://www.instagram.com/airbcar",
            ],
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
                "name": "Locations",
                "item": "https://airbcar.com/locations"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": data.name,
                "item": `https://airbcar.com/rental/${location}`
              }
            ]
          })
        }}
      />

      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Car Rental in {data.name}
          </h1>
          <p className="text-xl text-blue-100 mb-6">
            {data.description}
          </p>
          <Link
            href="/search"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Book Your Car Now
          </Link>
        </div>
      </section>

      {/* About Location */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">About {data.name}</h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-6">
          {data.description_long}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Why Rent with Airbcar in {data.name}?</h3>
            <ul className="space-y-3">
              {data.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Available Vehicle Types</h3>
            <ul className="space-y-3">
              {data.carTypes.map((carType, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                  <span className="text-gray-700">{carType}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ For Location */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Popular Questions About Renting in {data.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-bold text-lg mb-2">When should I book?</h3>
              <p className="text-gray-600">
                Peak season is April-October. Book 2-3 weeks ahead for best prices during peak season.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-bold text-lg mb-2">Is airport pickup available?</h3>
              <p className="text-gray-600">
                Yes! We offer convenient airport pickup and dropoff for all major airports in {data.name}.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-bold text-lg mb-2">What's included in the rental?</h3>
              <p className="text-gray-600">
                Basic insurance, unlimited mileage, roadside assistance, and 24/7 customer support.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-bold text-lg mb-2">Can I add an extra driver?</h3>
              <p className="text-gray-600">
                Yes! Additional drivers can be added for a small fee. They must have a valid license.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Explore {data.name}?
          </h2>
          <p className="text-xl text-blue-100 mb-6">
            Join thousands of satisfied customers. Book your car today.
          </p>
          <Link
            href="/search"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition"
          >
            Start Your Adventure
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
