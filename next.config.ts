import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Enables standalone production server bundle
  reactStrictMode: true,
};

export default nextConfig;
