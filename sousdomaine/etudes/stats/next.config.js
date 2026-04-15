/** @type {import('next').NextConfig} */
const nextConfig = {
  // Password protection will be handled via middleware
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ],
}

module.exports = nextConfig
