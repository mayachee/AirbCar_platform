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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtbmqtmmdobfvvecinif.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Custom webpack config - removed profiling aliases that cause issues with React 19
  webpack: (config, { dev, isServer }) => {
    // Remove problematic profiling aliases for React 19 compatibility

    // Ensure '@' alias points to the src directory explicitly for webpack
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    }

    // Optimize memory usage for development
    if (dev) {
      // Enhanced watch options for Windows/OneDrive compatibility
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 1200,
        ignored: [
          '**/*',
        ],
        followSymlinks: false,
        stdin: false,
      };
      
      // Add additional webpack options to reduce file locking issues
      // Use filesystem cache but with a safe directory outside OneDrive sync
      // Disable filesystem cache to reduce memory footprint
      config.cache = false;
    }

    return config
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
      'test-results/**',
      'playwright-report/**',
      'e2e/**',
      'docs/**',
      '.next-local/**',
    ],
  },
};

module.exports = nextConfig;
