'use client';

import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Car, Calendar, DollarSign, CheckCircle2, Factory, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import B2BRequestModal from '@/components/b2b/B2BRequestModal';
import { useQuery } from '@tanstack/react-query';
import { listingsService } from '@/services/api';

export default function B2BCarDetail() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('Partner');
  const tb = useTranslations('Buttons');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: car, isLoading, isError } = useQuery({
    queryKey: ['listing', params.id],
    queryFn: () => listingsService.getVehicle(params.id),
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !car) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-xl font-semibold text-gray-900">{t('carNotFound', { defaultMessage: 'Vehicle not found or an error occurred.' })}</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 font-medium">
          {tb('goBack', { defaultMessage: 'Go Back' })}
        </button>
      </div>
    );
  }

  const features = car.features || ['GPS', 'Bluetooth'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {tb('backToMarketplace', { defaultMessage: 'Back to Marketplace' })}
        </button>

        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:flex">
          <div className="bg-gray-200 lg:w-1/2 aspect-video flex justify-center items-center relative overflow-hidden">
               {car.images?.length > 0 ? (
                  <img src={car.images[0].image_url} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
               ) : (
                 <Car className="w-24 h-24 text-gray-400" />
               )}
               <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm text-sm font-bold text-gray-900">
                  {car.partner?.company_name || 'Partner Agency'}
               </div>
          </div>
          
          <div className="p-8 lg:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-extrabold text-gray-900">{car.make} {car.model}</h1>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">B2B Exchange</span>
              </div>
              <p className="text-gray-500 mb-6 text-lg">{car.year} {t('edition', { defaultMessage: 'Edition' })}</p>

              <p className="text-gray-700 leading-relaxed mb-6">
                {car.description || t('noDescription', { defaultMessage: 'No description available for this vehicle.' })}
              </p>

              <h2 className="font-semibold text-gray-900 mb-3">{t('keyFeatures', { defaultMessage: 'Key Features:' })}</h2>
              <ul className="grid grid-cols-2 gap-3 mb-8">
                {features.map(f => (
                  <li key={f} className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Section */}
            <div className="border-t border-gray-100 pt-6 mt-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{t('baseB2BRate', { defaultMessage: 'Base B2B Rate' })}</p>
                  <p className="text-3xl font-bold text-gray-900">${car.b2b_price}<span className="text-lg text-gray-500 font-normal"> / {t('day', { defaultMessage: 'day' })}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-blue-600 text-white font-semibold flex items-center justify-center py-4 rounded-xl hover:bg-blue-700 transition"
              >
                {tb('requestNegotiate', { defaultMessage: 'Request & Negotiate' })}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <B2BRequestModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          car={car} 
          b2bPrice={car.b2b_price} 
        />
      )}
    </div>
  );
}