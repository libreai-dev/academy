/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Serve the whole app under /academy so it can live at
  // https://www.libreai.dev/academy via a rewrite from the marketing site
  // (Next.js Multi-Zones). basePath auto-prefixes routes, <Link>, the router,
  // and the framework's /_next/* asset URLs.
  basePath: "/academy",
};

export default nextConfig;
