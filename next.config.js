/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  // Cache navigation so sidebar switches are instant on repeat visits
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  // Reload automatically when network comes back online
  reloadOnOnline: true,
  // Service worker disabled in dev — avoids caching stale code during development
  disable: process.env.NODE_ENV === 'development',
  // Never cache API calls — React Query owns that layer
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      // Skip service-worker caching for all backend API traffic
      urlPattern: /^\/api\//,
      handler: 'NetworkOnly',
    },
    {
      // External API (direct calls to Render backend)
      urlPattern: /asr-loyalty-api/,
      handler: 'NetworkOnly',
    },
    {
      // Static assets — serve from cache immediately, revalidate in background
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // Page navigations — try network first, fall back to cache when offline
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
});

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "https://asr-loyalty-api-1.onrender.com/api/v1";

// Internal Next.js API route prefixes — must NOT be proxied to the backend.
// Any new /app/api/* route handlers should be listed here.
const INTERNAL_API_PREFIXES = [
  '/api/auth/',
  '/api/system-status',
];

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      `connect-src 'self' ${API_URL} https://asr-loyalty-api-1.onrender.com wss: https://accounts.google.com`,
      "frame-src 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Proxy /api/* to backend EXCEPT internal Next.js API route handlers.
        // Next.js Route Handlers take precedence over rewrites by framework design,
        // but we use a negative lookahead pattern here to be explicit.
        source: '/api/:path((?!auth/|system-status).*)',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
  transpilePackages: ["react-icons"],
};

module.exports = withPWA(nextConfig);
