import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pack the Prisma query engine into every API function (Vercel looks in
  // /var/task/generated/client). vercel-build.sh copies it here after generate.
  outputFileTracingIncludes: {
    '/api/**': ['./generated/client/**'],
  },
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
    '@prisma/client',
    'ws',
    'bcryptjs',
  ],
};

export default nextConfig;
