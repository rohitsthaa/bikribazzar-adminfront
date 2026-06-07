/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Allow images served from the production API
        protocol: 'https',
        hostname: 'api.soulthreadktm.com',
        pathname: '/uploads/**',
      },
      {
        // Allow images in local development
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },
};
export default nextConfig;
