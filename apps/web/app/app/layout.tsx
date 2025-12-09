import { getServerSession } from '@/lib/auth/session';
import { siteConfig } from '@/lib/siteConfig';
import { redirect } from 'next/navigation';
import React, { ViewTransition } from 'react';

const AppLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await getServerSession();

  if (!session) {
    redirect(siteConfig.baseLinks.login);
  }

  return (
    <ViewTransition>
      <div className="min-h-screen overscroll-none p-3">{children}</div>
    </ViewTransition>
  );
};

export default AppLayout;
