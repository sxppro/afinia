export const siteConfig = {
  name: 'Afinia',
  url: 'https://afinia.io',
  description:
    'A next-generation financial insights platform for Up, with personalised insights and visualisations.',
  baseLinks: {
    home: '/',
    login: '/login',
    appHome: '/app',
    category: '/app/category',
    spending: '/app/spending',
  },
} as const;

export type siteConfig = typeof siteConfig;
