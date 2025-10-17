/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'api.quaxt.co.ke', 'api.qrserver.com'],
  },
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || 'https://api.quaxt.co.ke';
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
