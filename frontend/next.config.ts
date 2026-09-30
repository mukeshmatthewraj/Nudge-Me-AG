import type { NextConfig } from "next";

const isExport = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  output: isExport ? "export" : undefined,
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    if (isExport) return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
