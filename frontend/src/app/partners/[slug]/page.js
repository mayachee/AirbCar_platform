'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Redirect from /partners/[slug] to /partner/[slug]
 * The correct route is /partner/[slug] (singular)
 */
export default function PartnersRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.slug) {
      // Redirect to the correct singular route
      router.replace(`/partner/${params.slug}`);
    } else {
      router.replace('/partner');
    }
  }, [params.slug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}









