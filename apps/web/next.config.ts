import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@sourcetool/shared', '@sourcetool/ui'],
  images: {
    domains: ['m.media-amazon.com', 'images-na.ssl-images-amazon.com', 'i5.walmartimages.com', 'i.ebayimg.com'],
  },
};

export default nextConfig;
