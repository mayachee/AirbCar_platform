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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings for browser extension attributes
              (function() {
                const originalError = console.error;
                console.error = function(message) {
                  // Suppress known non-critical errors
                  if (
                    typeof message === 'string' && 
                    (
                      message.includes('data-new-gr-c-s-check-loaded') ||
                      message.includes('data-gr-ext-installed') ||
                      message.includes('Hydration failed') ||
                      message.includes('server rendered HTML didn\\'t match') ||
                      message.includes('Failed to fetch') && message.includes('pollForCommands')
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
              })();
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
