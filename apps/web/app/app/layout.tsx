import { BalanceVisibilityProvider } from '@/components/balance-visibility';
import { Toaster } from '@/components/ui/sonner';
import { getServerSession } from '@/lib/auth/session';
import { siteConfig } from '@/lib/siteConfig';
import { TRPCReactProvider } from '@/trpc/client';
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
    <TRPCReactProvider>
      <ViewTransition>
        <NuqsAdapter>
          <BalanceVisibilityProvider>
            <div className="min-h-screen overscroll-none p-3">{children}</div>
            <Toaster />
            <div className="flex w-full items-center justify-center py-2">
              <p className="text-muted-foreground text-sm">Powered by Afinia</p>
            </div>
          </BalanceVisibilityProvider>
        </NuqsAdapter>
      </ViewTransition>
    </TRPCReactProvider>
  );
};

export default AppLayout;
