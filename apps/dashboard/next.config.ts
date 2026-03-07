import type { NextConfig } from 'next';
import { env } from './src/config/env';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: env.nextDistDir,
  transpilePackages: ['@aicp/shared-types'],
};

export default nextConfig;
