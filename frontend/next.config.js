const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  // Suppress hydration warnings during development
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000, // Increased from 25s to 60s to prevent chunk unload
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5, // Increased from 2 to 5
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Reduce build memory usage - SWC minification is enabled by default in Next.js 15
  // Don't use 'standalone' output for Vercel - it uses serverless functions
  // Allow cross-origin requests from Docker network IP
  allowedDevOrigins: [
    'http://172.18.240.1:3001',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ],
  // Moved from experimental (Next.js 15+)
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtbmqtmmdobfvvecinif.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'airbcar-backend.onrender.com',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/**',
      },
    ],
    // Optimize images for Vercel
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    // Disable remote SVGs by default (defense-in-depth against scriptable SVG payloads)
    dangerouslyAllowSVG: process.env.ALLOW_SVG_IMAGES === 'true',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async headers() {
    const securityHeaders = [
      // MIME sniffing + clickjacking protection
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },

      // Safer defaults; avoids breaking Next.js inline scripts
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "base-uri 'self'; frame-ancestors 'none'; object-src 'none'" },
    ];

    if (isProd) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  // Custom webpack config - minimal changes to avoid breaking React 19 module resolution
  webpack: (config, { dev, isServer }) => {
    // Ensure '@' alias points to the src directory
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };

    // Always disable symlink resolution to avoid OneDrive issues on Windows
    config.resolve.symlinks = false;

    // Disable webpack cache if disk space is low (ENOSPC errors)
    // This helps when building on systems with limited disk space
    if (process.env.DISABLE_WEBPACK_CACHE === 'true') {
      config.cache = false;
    } else if (!dev && process.env.NODE_ENV === 'production') {
      // In production builds, use memory cache instead of filesystem to save disk space
      config.cache = {
        type: 'memory',
        maxGenerations: 1,
      };
    }

    // Optimize for development
    if (dev && !isServer) {
      // Enhanced watch options for Windows/OneDrive compatibility
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 1200,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/.git/**',
        ],
      };
    }

    return config;
  },

  // Set workspace root to avoid lockfile warnings
  outputFileTracingRoot: path.resolve(__dirname),
  // Exclude large directories from file tracing to save memory
  outputFileTracingExcludes: {
    '*': [
      'public/**',
      'public/partner/**',
      'public/**/*.jpg',
      'public/**/*.jpeg',
      'public/**/*.png',
      'public/**/*.gif',
      'public/**/*.webp',
      'public/**/*.mp4',
      'public/**/*.mov',
      'src/app/public/**',
      'docs/**',
      '.next-local/**',
    ],
  },
};

module.exports = nextConfig;
