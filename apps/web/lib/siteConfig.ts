export const siteConfig = {
  name: 'Afinia',
  url: 'https://afinia.io',
  description:
    'A next-generation financial insights platform for Up, with personalised insights and visualisations.',
  baseLinks: {
    home: '/',
    login: '/login',
    loginError: '/login/error',
    appHome: '/app',
    accounts: '/app/accounts',
    merchants: '/app/merchants',
    spending: '/app/spending',
    insights: '/app/insights',
    transactions: '/app/transactions',
  },
} as const;

export type siteConfig = typeof siteConfig;
