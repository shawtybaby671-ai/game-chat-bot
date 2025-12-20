/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [], // add domains later if needed for external images
  },
};

module.exports = nextConfig;
