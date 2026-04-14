import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { getOrganizationSchema, getLocalBusinessSchema } from "@/lib/seoConfig";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.airbcar.com'),
  title: "Airbcar - Morocco's Premier Car Rental Platform",
  description: "First moroccan Cars rental platform with premium vehicles and professional service",
  openGraph: {
    title: "Airbcar - Morocco's Premier Car Rental Platform",
    description: "First moroccan Cars rental platform with premium vehicles and professional service",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html data-scroll-behavior="smooth" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="application-name" content="Airbcar" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Structured Data for Organization and CEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationSchema())
          }}
        />
        
        {/* Business Directory Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getLocalBusinessSchema())
          }}
        />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize dark mode (saved preference or system)
              (function() {
                try {
                  var root = document.documentElement;
                  var saved = localStorage.getItem('airbcar_theme');
                  if (saved === 'dark') { root.classList.add('dark'); }
                  else if (saved === 'light') { root.classList.remove('dark'); }
                  else {
                    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) root.classList.add('dark');
                    else root.classList.remove('dark');
                  }
                } catch (e) {}
              })();

              // Suppress hydration warnings and non-critical errors
              (function() {
                const originalError = console.error;
                const originalWarn = console.warn;
                
                console.error = function(message) {
                  // Check for Google Sign-In origin error and flag it
                  if (typeof message === 'string' && message.includes('[GSI_LOGGER]: The given origin is not allowed')) {
                    window.gsiOriginError = true;
                    // Don't suppress this - let it show so user knows there's a config issue
                    originalError.apply(console, arguments);
                    return;
                  }
                  
                  // Suppress known non-critical errors
                  if (
                    typeof message === 'string' && 
                    (
                      message.includes('data-new-gr-c-s-check-loaded') ||
                      message.includes('data-gr-ext-installed') ||
                      message.includes('Hydration failed') ||
                      message.includes('server rendered HTML didn\\'t match') ||
                      message.includes('Failed to fetch') && message.includes('pollForCommands') ||
                      message.includes('sentry.io') ||
                      message.includes('ERR_BLOCKED_BY_CLIENT') ||
                      message.includes('Cross-Origin-Opener-Policy') ||
                      message.includes('play.google.com/log') ||
                      message.includes('credential_button_library')
                    )
                  ) {
                    return;
                  }
                  
                  // Suppress "Failed to fetch" from pollForCommands (Next.js dev server polling)
                  if (typeof message === 'string' && message.includes('pollForCommands')) {
                    return;
                  }
                  
                  originalError.apply(console, arguments);
                };
                
                // Suppress Sentry-related warnings
                console.warn = function(message) {
                  // Check for Google Sign-In origin error and flag it
                  if (typeof message === 'string' && message.includes('[GSI_LOGGER]: The given origin is not allowed')) {
                    window.gsiOriginError = true;
                    // Don't suppress this - let it show so user knows there's a config issue
                    originalWarn.apply(console, arguments);
                    return;
                  }
                  
                  if (
                    typeof message === 'string' && 
                    (
                      message.includes('sentry.io') || 
                      message.includes('ERR_BLOCKED_BY_CLIENT') ||
                      message.includes('Cross-Origin-Opener-Policy') ||
                      message.includes('play.google.com/log') ||
                      message.includes('credential_button_library')
                    )
                  ) {
                    return;
                  }
                  originalWarn.apply(console, arguments);
                };
              })();
              
              // Suppress network errors for Sentry and Google Sign-In (blocked by ad blockers)
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (
                    e.message && (
                      e.message.includes('sentry.io') ||
                      e.message.includes('play.google.com/log') ||
                      e.message.includes('ERR_BLOCKED_BY_CLIENT') ||
                      e.message.includes('Cross-Origin-Opener-Policy')
                    )
                  ) {
                    e.preventDefault();
                    return false;
                  }
                }, true);
                
                // Suppress unhandled promise rejections from Google Sign-In
                window.addEventListener('unhandledrejection', function(e) {
                  if (
                    e.reason && typeof e.reason === 'object' &&
                    e.reason.message && (
                      e.reason.message.includes('play.google.com/log') ||
                      e.reason.message.includes('ERR_BLOCKED_BY_CLIENT') ||
                      e.reason.message.includes('Cross-Origin-Opener-Policy')
                    )
                  ) {
                    e.preventDefault();
                    return false;
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body 
        className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
