import withPWAInit from '@ducanh2912/next-pwa';

// Check if the current environment is development mode
const isDev = process.env['NODE_ENV'] === 'development';
// Determine the application platform from environment variables
const appPlatform = process.env['NEXT_PUBLIC_APP_PLATFORM'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for outputting static files (SSG)
  // If in 'web' mode or development, no static export. Otherwise, export to static site.
  output: appPlatform === 'web' || isDev ? undefined : 'export',

  // Image optimization settings
  images: {
    // Disable image optimization. Required when using SSG with Next.js Image component.
    unoptimized: true,
  },

  // Disable development indicators in the browser
  devIndicators: false,

  // Base path for all assets. Empty in this case.
  // If you host your app under a subpath (e.g., example.com/my-app/), you'd set it here.
  assetPrefix: '',

  // Enable React strict mode for development checks
  reactStrictMode: true,

  // Custom headers configuration
  async headers() {
    return [
      {
        // Set Content-Type for apple-app-site-association file to application/json.
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

// Configuration for Next PWA (Progressive Web App)
const withPWA = withPWAInit({
  // Destination folder for service worker files
  dest: 'public',
  // Disable PWA if in development or if the platform is not 'web'
  disable: isDev || appPlatform !== 'web',
  // Enable caching of pages when navigating
  cacheOnFrontEndNav: true,
  // Enable more aggressive caching of pages
  aggressiveFrontEndNavCaching: true,
  // Force a reload when the user comes back online.
  reloadOnOnline: true,
  // Enable SWC minification.
  swcMinify: true,
  // Fallback page for offline mode
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true, // Disable the logs in the development mode.
  },
});

export default withPWA(nextConfig);
