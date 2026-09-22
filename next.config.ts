import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  distDir: process.env.PILOT_NEXT_DIST_DIR ?? ".next",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
