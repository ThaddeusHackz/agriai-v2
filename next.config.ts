import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the live-preview sandbox origin during development
  allowedDevOrigins: ["*.e2b.app"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
