import { Toaster } from '@/components/ui/sonner';
import { getServerSession } from '@/lib/auth/session';
import { siteConfig } from '@/lib/siteConfig';
import { redirect } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
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
      <NuqsAdapter>
        <div className="min-h-screen overscroll-none p-3">{children}</div>
        <Toaster />
      </NuqsAdapter>
    </ViewTransition>
  );
};

export default AppLayout;
