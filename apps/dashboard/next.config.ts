import type { NextConfig } from 'next';
import { env } from './src/config/env';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: env.nextDistDir,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
