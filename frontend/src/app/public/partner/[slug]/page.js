import { redirect } from 'next/navigation';

/**
 * Redirect from incorrect /public/partner/[slug] to correct /partner/[slug]
 * The /public/ part is only in the backend API URL, not the frontend route
 * This is a server component that performs a server-side redirect
 */
export default async function PublicPartnerRedirect({ params }) {
  const { slug } = await params;
  
  if (slug) {
    // Server-side redirect to the correct route (without /public/)
    redirect(`/partner/${slug}`);
  } else {
    redirect('/partner');
  }
}







