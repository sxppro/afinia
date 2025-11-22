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
      <div className="p-3 [view-transition-name=app]">{children}</div>;
    </ViewTransition>
  );
};

export default AppLayout;
