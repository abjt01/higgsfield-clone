import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a lockfile in a parent directory otherwise makes
  // Turbopack infer the wrong one and warn on every build.
  turbopack: { root: __dirname },
  images: {
    // Without this next/image rejects Blob URLs in production with
    // "hostname is not configured", which only shows up after deploy.
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
    ],
  },
};

export default nextConfig;
