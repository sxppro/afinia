import { BalanceVisibilityProvider } from '@/components/balance-visibility';
import { Toaster } from '@/components/ui/sonner';
import { TRPCReactProvider } from '@/trpc/client';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React, { ViewTransition } from 'react';

/**
 * Avoid request-time reads so this can be prerendered
 */
const AppLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <TRPCReactProvider>
      <ViewTransition default={{ refresh: 'none', default: 'auto' }}>
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
