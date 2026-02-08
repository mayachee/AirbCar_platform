import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match root
    '/',
    // Match locale prefixes
    '/(fr|ar)/:path*',
    // Match all pathnames except API, Next internals, Vercel internals, and static files
    '/((?!api|_next|_vercel|debug-env|.*\\..*).*)',
  ],
};

