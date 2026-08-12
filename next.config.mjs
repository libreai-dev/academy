/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Personal site served at the domain root (https://xavier-ramirez.com/).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
