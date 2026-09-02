import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Monorepo: include workspace packages when Vercel traces serverless functions.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: [
    '@sourcetool/shared',
    '@sourcetool/ui',
    '@sourcetool/db',
    '@sourcetool/ai',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'i5.walmartimages.com' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
    ],
  },
  serverExternalPackages: [
    '@neondatabase/serverless',
    '@prisma/adapter-neon',
    'ws',
    'bcryptjs',
  ],
};

export default nextConfig;
