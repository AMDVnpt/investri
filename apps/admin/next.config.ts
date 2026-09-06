import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@investri/ui"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
