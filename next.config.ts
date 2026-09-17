import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a lockfile in a parent directory otherwise makes
  // Turbopack infer the wrong one and warn on every build.
  turbopack: { root: __dirname },
  /* config options here */
};

export default nextConfig;
