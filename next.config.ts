import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow build despite type errors from dependencies
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
