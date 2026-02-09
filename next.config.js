/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:9000/api/v1";

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
  transpilePackages: ['react-icons'],
  webpack: (config, { isServer }) => {
    // Fix for react-icons barrel optimization issue
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Disable barrel optimization for react-icons
    if (!isServer) {
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx'],
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
