/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude puppeteer from webpack bundling on server side
      config.externals.push('puppeteer');
    }
    return config;
  },
  // Allow longer API timeout pentru scraping operations
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig