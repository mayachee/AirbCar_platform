'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Car, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import B2BSubNav from '@/components/b2b/B2BSubNav'
import { AgencyAvatar, formatMad } from '@/components/b2b/common'
import B2BRequestModal from '@/components/b2b/B2BRequestModal'

/**
 * B2B listing detail. Fetched live from /listings/<id>/ (the same endpoint
 * the public car detail uses), so all the B2B-relevant fields — public_id,
 * b2b_price_per_day, partner block — flow through unchanged.
 *
 * The "Request & Negotiate" CTA opens B2BRequestModal which posts a real
 * CarShareRequest; the response is tracked in /partner/b2b/requests (V4).
 */
export default function B2BCarDetail() {
  const params = useParams()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['b2b', 'listing', params.id],
    queryFn: () => apiClient.get(`/listings/${params.id}/`),
    enabled: !!params.id,
  })

  const car = response?.data?.data || response?.data || null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <B2BSubNav />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  if (isError || !car) {
    return (
      <div className="min-h-screen bg-gray-50">
        <B2BSubNav />
        <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h1 className="text-xl font-semibold text-gray-900">Vehicle not found.</h1>
          <p className="text-sm text-gray-500 mt-2">
            The listing may have been removed or is no longer available.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    )
  }

  const partner = car.partner || {}
  const features = Array.isArray(car.available_features) ? car.available_features : []
  const image =
    car.images?.[0]?.url ||
    car.images?.[0]?.image ||
    (typeof car.images?.[0] === 'string' ? car.images[0] : null)
  const dailyRate = car.b2b_price_per_day ?? car.price_per_day

  return (
    <div className="min-h-screen bg-gray-50">
      <B2BSubNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:flex">
          <div className="bg-gray-100 lg:w-1/2 aspect-video lg:aspect-auto flex items-center justify-center relative overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <Car className="w-16 h-16 text-gray-300" />
            )}
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
              <AgencyAvatar
                name={partner.business_name || partner.businessName}
                logoUrl={partner.logo_url}
                size={20}
              />
              <span className="text-sm font-bold text-gray-900">
                {partner.business_name || partner.businessName || 'Partner Agency'}
              </span>
            </div>
          </div>

          <div className="p-8 lg:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2 gap-3">
                <h1 className="text-3xl font-extrabold text-gray-900">
                  {car.make} {car.model}
                </h1>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                  B2B Exchange
                </span>
              </div>
              <p className="text-gray-500 mb-6 text-lg">
                {car.year} ·{' '}
                <span className="capitalize">{car.vehicle_style || car.style || 'Vehicle'}</span>
              </p>

              {(car.vehicle_description || car.description) && (
                <p className="text-gray-700 leading-relaxed mb-6">
                  {car.vehicle_description || car.description}
                </p>
              )}

              {features.length > 0 && (
                <>
                  <h2 className="font-semibold text-gray-900 mb-3">Key features</h2>
                  <ul className="grid grid-cols-2 gap-3 mb-8">
                    {features.slice(0, 6).map((f) => (
                      <li key={f} className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 mt-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Base B2B rate
                  </p>
                  <p className="text-3xl font-black text-orange-600">
                    {formatMad(dailyRate, '')}
                    <span className="text-base text-gray-500 font-medium ml-1">/ day</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-orange-500 text-white font-bold flex items-center justify-center py-4 rounded-xl hover:bg-orange-600 transition"
              >
                Request &amp; negotiate
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <B2BRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          car={car}
          b2bPrice={dailyRate}
        />
      )}
    </div>
  )
}
