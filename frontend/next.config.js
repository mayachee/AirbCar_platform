/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  distDir: '.next-local', // Use a different directory to avoid OneDrive syncing issues
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Suppress hydration warnings during development
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Custom webpack config - removed profiling aliases that cause issues with React 19
  webpack: (config, { dev, isServer }) => {
    // Remove problematic profiling aliases for React 19 compatibility

    // Ensure '@' alias points to the src directory explicitly for webpack
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    }

    // Optimize memory usage for development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
      
      // Reduce memory usage
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    return config
  },

  // Turbopack configuration
  experimental: {
    turbo: {
      resolveAlias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },
};

module.exports = nextConfig;
