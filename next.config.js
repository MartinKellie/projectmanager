const { version } = require('./package.json')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  images: {
    domains: ['drive.google.com'],
  },
}

module.exports = nextConfig
