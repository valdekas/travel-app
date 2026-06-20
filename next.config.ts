import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['38.242.252.59', 'travel365.live'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
