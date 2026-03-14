import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@survey/shared'],
  output: 'standalone',
};

export default nextConfig;
