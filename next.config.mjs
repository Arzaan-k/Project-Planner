/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable Vercel Analytics for now to prevent 404 errors
  experimental: {
    instrumentationHook: false,
  },
}

export default nextConfig
