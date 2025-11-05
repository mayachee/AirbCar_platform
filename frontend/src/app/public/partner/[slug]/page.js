'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Redirect from incorrect /public/partner/[slug] to correct /partner/[slug]
 * The /public/ part is only in the backend API URL, not the frontend route
 */
export default function PublicPartnerRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.slug) {
      // Redirect to the correct route (without /public/)
      router.replace(`/partner/${params.slug}`);
    } else {
      router.replace('/partner');
    }
  }, [params.slug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to correct route...</p>
      </div>
    </div>
  );
}


