import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/s20230204060/vps-demo";

const nextConfig: NextConfig = {
  basePath,
};

export default nextConfig;
