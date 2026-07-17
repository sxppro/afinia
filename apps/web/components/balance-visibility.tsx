'use client';

import { createContext, use, useEffect, useState } from 'react';

type BalanceVisibilityContextType = {
  isVisible: boolean;
  toggle: () => void;
};

const BalanceVisibilityContext =
  createContext<BalanceVisibilityContextType | null>(null);

export const BalanceVisibilityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Note: disabling as this should only run once
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVisible(localStorage.getItem('balanceVisibility') === 'true');
  }, []);

  const toggle = () => {
    const next = !isVisible;
    localStorage.setItem('balanceVisibility', String(next));
    setIsVisible(next);
  };

  return (
    <BalanceVisibilityContext.Provider value={{ isVisible, toggle }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
};

export const useBalanceVisibility = () => {
  const context = use(BalanceVisibilityContext);

  if (!context) {
    throw new Error(
      'useBalanceVisibility must be used within a BalanceVisibilityProvider'
    );
  }

  return context;
};
