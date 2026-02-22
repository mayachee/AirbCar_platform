/**
 * CEO and Organization Information for SEO
 * Update this file with your actual CEO and business details
 */

export const organizationConfig = {
  // Organization Info
  organization: {
    name: "Airbcar",
    alternateName: "Airbcar Morocco Car Rental",
    url: "https://airbcar.com",
    logo: "https://airbcar.com/logo.png",
    description: "First moroccan Cars rental platform with premium vehicles and professional service",
    foundingDate: "2023",
    foundingLocation: "Morocco",
    areaServed: "Morocco",
  },

  // CEO Information
  ceo: {
    name: "CEO Name", // Update with actual CEO name
    title: "Chief Executive Officer",
    email: "ceo@airbcar.com",
    phone: "+212-YOUR-PHONE",
    image: "https://airbcar.com/ceo-photo.jpg",
    bio: "Leading Morocco's car rental innovation and excellence",
    linkedInURL: "https://linkedin.com/in/ceo-name",
    twitterURL: "https://twitter.com/ceo-handle",
  },

  // Contact Information
  contact: {
    email: "support@airbcar.com",
    phone: "+212-YOUR-NUMBER",
    address: {
      streetAddress: "Casablanca",
      addressLocality: "Casablanca",
      addressRegion: "Morocco",
      addressCountry: "Ma",
      postalCode: "20000",
    },
    coordinates: {
      latitude: "33.5731",
      longitude: "-7.5898",
    },
  },

  // Business Hours
  openingHours: {
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "06:00",
    closes: "22:00",
  },

  // Social Media Links
  socialMedia: {
    facebook: "https://www.facebook.com/airbcar",
    instagram: "https://www.instagram.com/airbcar",
    twitter: "https://twitter.com/airbcar",
    linkedin: "https://www.linkedin.com/company/airbcar",
    youtube: "https://www.youtube.com/airbcar",
  },

  // Reviews and Ratings (update with actual data)
  rating: {
    ratingValue: "4.8",
    reviewCount: "1200",
    bestRating: "5",
    worstRating: "1",
  },
};

/**
 * Get structured data for Organization Schema
 * Used in layout.js for JSON-LD
 */
export function getOrganizationSchema() {
  const { organization, ceo, contact, openingHours, rating } = organizationConfig;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organization.name,
    alternateName: organization.alternateName,
    url: organization.url,
    logo: organization.logo,
    description: organization.description,
    foundingDate: organization.foundingDate,
    foundingLocation: {
      "@type": "Place",
      name: organization.foundingLocation,
    },
    areaServed: {
      "@type": "Country",
      name: organization.areaServed,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: contact.email,
      telephone: contact.phone,
      areaServed: "MA",
      availableLanguage: ["en", "ar", "fr"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.streetAddress,
      addressLocality: contact.address.addressLocality,
      addressRegion: contact.address.addressRegion,
      addressCountry: contact.address.addressCountry,
      postalCode: contact.address.postalCode,
    },
    sameAs: [
      organizationConfig.socialMedia.facebook,
      organizationConfig.socialMedia.instagram,
      organizationConfig.socialMedia.twitter,
      organizationConfig.socialMedia.linkedin,
    ],
    knowsAbout: ["Car Rental", "Vehicle Rental", "Transportation", "Morocco Tourism"],
    employee: {
      "@type": "Person",
      name: ceo.name,
      jobTitle: ceo.title,
      email: ceo.email,
      telephone: ceo.phone,
      image: ceo.image,
      description: ceo.bio,
      sameAs: [ceo.linkedInURL, ceo.twitterURL].filter(Boolean),
    },
  };
}

/**
 * Get structured data for Local Business Schema
 * Used in layout.js for JSON-LD
 */
export function getLocalBusinessSchema() {
  const { organization, contact, openingHours, rating } = organizationConfig;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": organization.url,
    name: organization.name,
    image: organization.logo,
    description: organization.description,
    url: organization.url,
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.streetAddress,
      addressLocality: contact.address.addressLocality,
      addressRegion: contact.address.addressRegion,
      addressCountry: contact.address.addressCountry,
      postalCode: contact.address.postalCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.coordinates.latitude,
      longitude: contact.coordinates.longitude,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: openingHours.dayOfWeek,
      opens: openingHours.opens,
      closes: openingHours.closes,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating.ratingValue,
      reviewCount: rating.reviewCount,
      bestRating: rating.bestRating,
      worstRating: rating.worstRating,
    },
    priceRange: "MAD",
  };
}
