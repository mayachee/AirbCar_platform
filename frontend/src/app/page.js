// Root page - with 'as-needed' locale prefix, the middleware handles this
// The middleware will serve the default locale content at '/' directly
// This page should not be needed, but exists as a fallback
export default function RootPage() {
  // Return null - the middleware should handle routing
  // If this page is reached, something went wrong with the middleware
  return null;
}
