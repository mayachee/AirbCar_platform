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
    maxInactiveAge: 60 * 1000, // Increased from 25s to 60s to prevent chunk unload
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5, // Increased from 2 to 5
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
      // Enhanced watch options for Windows/OneDrive compatibility
      config.watchOptions = {
        poll: 2000, // Increased polling interval for better OneDrive compatibility
        aggregateTimeout: 800, // Wait longer before rebuilding to avoid rapid file changes
        ignored: [
          '**/node_modules/**',
          '**/.next-local/**',
          '**/.next/**',
          '**/.git/**',
          '**/out/**',
          '**/public/**',
          '**/src/app/public/**',
          '**/test-results/**',
          '**/playwright-report/**',
          '**/e2e/**',
          '**/docs/**',
          '**/__mocks__/**',
          '**/*.test.js',
          '**/*.test.jsx',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.spec.js',
          '**/*.spec.jsx',
        ],
        followSymlinks: false,
        // Add file system options to handle OneDrive better
        stdin: false,
      };
      
      // Add additional webpack options to reduce file locking issues
      // Use filesystem cache but with a safe directory outside OneDrive sync
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(__dirname, '.next-local/.cache'),
        // Disable symlinks on Windows to avoid OneDrive issues
        compression: 'gzip',
        store: 'pack',
      };
      
      // Disable symlink resolution to prevent EINVAL errors on Windows/OneDrive
      config.resolve.symlinks = false;
      
      // Reduce memory usage
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Better error handling for file system issues
      config.infrastructureLogging = {
        level: 'error',
      };
    }

    return config
  },

  // Turbopack configuration (more memory efficient)
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  // External packages for server components (moved from experimental in Next.js 15+)
  serverExternalPackages: [],
  
  // Experimental features to reduce memory usage
  experimental: {
    // Optimize memory for file system operations
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Set workspace root to avoid lockfile warnings
  outputFileTracingRoot: path.resolve(__dirname),
  
  // Exclude large directories from file tracing to save memory
  outputFileTracingExcludes: {
    '*': [
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
