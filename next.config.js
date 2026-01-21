/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // 이미지 최적화
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // 번들 최적화 - AWS SDK와 같은 무거운 패키지 최적화
  experimental: {
    optimizePackageImports: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  },

}

module.exports = nextConfig
