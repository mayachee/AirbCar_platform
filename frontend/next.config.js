const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
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
  // Moved from experimental (Next.js 15+)
  serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtbmqtmmdobfvvecinif.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Custom webpack config - minimal changes to avoid breaking React 19 module resolution
  webpack: (config, { dev, isServer }) => {
    // Ensure '@' alias points to the src directory
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };

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
      
      // Disable symlink resolution to avoid OneDrive issues
      config.resolve.symlinks = false;
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
