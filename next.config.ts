/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',      // Required for GitHub Pages
  images: {
    unoptimized: true,   // GitHub Pages doesn't support Next.js Image Optimization
  },
  // If your repo is NOT named <username>.github.io (e.g., it is /portfolio)
  // set the basePath: '/portfolio'
};

export default nextConfig;