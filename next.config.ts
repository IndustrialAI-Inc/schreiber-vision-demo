import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_DISABLE_ERROR_OVERLAY: 'true',
  },
  devIndicators: false, // Disables the build indicator and prerender indicator
};

export default nextConfig;
