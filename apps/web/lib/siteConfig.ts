export const siteConfig = {
  name: 'Afinia',
  url: 'https://upboard.app',
  description:
    'A next-generation financial insights platform for Up, with personalised insights and visualisations.',
  baseLinks: {
    appHome: '/app',
    category: '/app/category',
    home: '/',
    login: '/login',
  },
} as const;

export type siteConfig = typeof siteConfig;
