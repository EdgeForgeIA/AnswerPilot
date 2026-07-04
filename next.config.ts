import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the dev-mode indicator clear of the sidebar footer.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
