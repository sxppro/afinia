import { BalanceVisibilityProvider } from '@/components/balance-visibility';
import { Toaster } from '@/components/ui/sonner';
import { getServerSession } from '@/lib/auth/session';
import { siteConfig } from '@/lib/siteConfig';
import { TRPCReactProvider } from '@/trpc/client';
import { redirect } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React from 'react';

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
    <TRPCReactProvider>
      <NuqsAdapter>
        <BalanceVisibilityProvider>
          <div className="min-h-screen overscroll-none p-3">{children}</div>
          <Toaster />
        </BalanceVisibilityProvider>
      </NuqsAdapter>
    </TRPCReactProvider>
  );
};

export default AppLayout;
