import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error -- nodeMiddleware is stable in Next.js 15.5 but types lag behind
    nodeMiddleware: true,
  },
};

export default nextConfig;
