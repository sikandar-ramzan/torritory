import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // WARNING: This allows production builds to complete even if
    // your project has type errors. Use with caution!
    ignoreBuildErrors: true,
  },

  eslint: {
    // If you also want to skip ESLint errors during build:
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
