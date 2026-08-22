/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['vercel.blob.core.windows.net'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;

