import { auth } from '@/lib/auth/config';
import { siteConfig } from '@/lib/siteConfig';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

const AppLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(siteConfig.baseLinks.login);
  }

  return <div className="p-3">{children}</div>;
};

export default AppLayout;
