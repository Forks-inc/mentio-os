import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    // Author avatars come from every platform Mentio watches.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default config;
