/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/sim/:path*', destination: '/v1/:path*' }
    ]
  }
}

export default nextConfig
