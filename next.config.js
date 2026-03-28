/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle jsPDF and html2canvas which have server-only dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      worker_threads: false,
      fs: false,
      path: false,
      crypto: false,
    }

    return config
  },
}

module.exports = nextConfig
