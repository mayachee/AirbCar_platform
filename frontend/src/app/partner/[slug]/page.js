'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Building2, MapPin, Phone, Globe, Star, Calendar, Car, CheckCircle, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '@/constants';

function PartnerProfileContent() {
  const params = useParams();
  const router = useRouter();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = API_BASE_URL;
        const url = `${apiUrl}/api/partners/public/${params.slug}/`;
        
        console.log('🔍 Fetching partner profile:', {
          slug: params.slug,
          apiUrl: apiUrl,
          fullUrl: url
        });
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
          // Try to get error message - could be JSON or HTML
          let errorData = {};
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = await response.json();
            } catch (e) {
              console.error('Failed to parse JSON error:', e);
            }
          } else {
            // Might be HTML or plain text
            try {
              const text = await response.text();
              console.error('❌ Non-JSON response:', text.substring(0, 500));
              errorData = { error: text.substring(0, 200), raw: true };
            } catch (e) {
              console.error('Failed to read error response:', e);
            }
          }
          
          console.error('❌ API Error:', errorData);
          
          if (response.status === 404) {
            setError(`Partner profile not found (ID/Slug: ${params.slug})`);
          } else {
            setError(`Failed to load partner profile: ${errorData.error || response.statusText}`);
          }
          return;
        }
        
        const data = await response.json();
        console.log('✅ Partner data received:', {
          id: data.id,
          company_name: data.company_name,
          slug: data.slug,
          status: data.verification_status
        });
        
        // If accessed via ID instead of slug, redirect to slug URL
        if (data.slug && params.slug !== data.slug && params.slug.match(/^\d+$/)) {
          console.log('🔄 Redirecting to slug URL:', data.slug);
          router.replace(`/partner/${data.slug}`);
          return;
        }
        
        setPartner(data);
      } catch (err) {
        console.error('💥 Error fetching partner:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(`Failed to load partner profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchPartner();
    } else {
      console.warn('⚠️ No slug provided in params:', params);
    }
  }, [params.slug, router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const handleViewListing = (listingId) => {
    router.push(`/car/${listingId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading partner profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error ? 'Unable to load profile' : 'Partner not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The partner profile you're looking for doesn't exist or is not available."}
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => router.push('/search')}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Browse Cars
              </button>
              <button 
                onClick={() => router.push('/')}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              {partner.logo ? (
                <img 
                  src={partner.logo} 
                  alt={partner.company_name}
                  className="w-32 h-32 rounded-full object-cover bg-white p-2 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                  <Building2 className="w-16 h-16" />
                </div>
              )}
            </div>
            
            {/* Company Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-4xl font-bold">{partner.company_name}</h1>
                {partner.verification_status === 'approved' && (
                  <CheckCircle className="w-6 h-6 text-green-300" title="Verified Partner" />
                )}
              </div>
              
              {partner.description && (
                <p className="text-lg text-white/90 mb-4 max-w-3xl">
                  {partner.description}
                </p>
              )}
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 justify-center md:justify-start mt-6">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  <span className="font-semibold">{partner.total_listings || 0} Vehicles</span>
                </div>
                {partner.average_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-semibold">{partner.average_rating.toFixed(1)} Rating</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Member since {formatDate(partner.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      {(partner.phone || partner.address || partner.website) && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap gap-6 justify-center">
              {partner.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-5 h-5 text-orange-500" />
                  <span>{partner.phone}</span>
                </div>
              )}
              {partner.address && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <span>{partner.address}</span>
                </div>
              )}
              {partner.website && (
                <a 
                  href={partner.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                >
                  <Globe className="w-5 h-5" />
                  <span>Visit Website</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Available Vehicles ({partner.listings?.length || 0})
          </h2>
          <p className="text-gray-600">
            Browse our fleet of vehicles available for rent
          </p>
        </div>

        {!partner.listings || partner.listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles available</h3>
            <p className="text-gray-600">This partner doesn't have any vehicles listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {partner.listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
                onClick={() => handleViewListing(listing.id)}
              >
                {/* Vehicle Image */}
                <div className="relative h-48 bg-gray-200">
                  {listing.pictures && listing.pictures.length > 0 ? (
                    <img
                      src={listing.pictures[0]}
                      alt={`${listing.make} ${listing.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {listing.rating > 0 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-semibold">{listing.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Vehicle Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {listing.make} {listing.model}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{listing.year}</p>
                  
                  {listing.location && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      ${parseFloat(listing.price_per_day).toFixed(0)}
                    </span>
                    <span className="text-gray-500 text-sm">/day</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function PartnerProfile() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading partner profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <PartnerProfileContent />
    </Suspense>
  );
}
