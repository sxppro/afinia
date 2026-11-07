import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    /**
     * Spending data cache profile
     * Stale - browser cache TTL
     * Revalidate - server cache TTL stale-while-revalidate
     * Expire - server cache expiry
     */
    spending: { stale: 300, revalidate: 60, expire: 3600 },
  },
};

export default nextConfig;
