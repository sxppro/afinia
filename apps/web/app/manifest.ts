import { siteConfig } from '@/lib/siteConfig';
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: siteConfig.baseLinks.appHome,
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#f8fafc',
    icons: [
      {
        src: '/icon-256x256@1x.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icon-512x512@1x.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
