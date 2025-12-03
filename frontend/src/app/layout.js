import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Airbcar",
  description: "First moroccan Cars rental platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings and non-critical errors
              (function() {
                const originalError = console.error;
                const originalWarn = console.warn;
                
                console.error = function(message) {
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
                      message.includes('ERR_BLOCKED_BY_CLIENT')
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
                  if (
                    typeof message === 'string' && 
                    (message.includes('sentry.io') || message.includes('ERR_BLOCKED_BY_CLIENT'))
                  ) {
                    return;
                  }
                  originalWarn.apply(console, arguments);
                };
              })();
              
              // Suppress network errors for Sentry (blocked by ad blockers)
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('sentry.io')) {
                    e.preventDefault();
                    return false;
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
