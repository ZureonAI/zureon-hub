import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/hub-dist',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'tonapi.io' },
      { protocol: 'https', hostname: '**.ton-nft.com' },
      { protocol: 'https', hostname: 'cache.tonapi.io' },
    ],
  },
}

export default nextConfig
