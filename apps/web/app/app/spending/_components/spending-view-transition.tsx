import { ReactNode, ViewTransition } from 'react';

const DIRECTIONS = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  default: 'none',
};

/**
 * Apply view transition based on link transition type
 */
const SpendingViewTransition = ({ children }: { children: ReactNode }) => (
  <ViewTransition enter={DIRECTIONS} exit={DIRECTIONS} default="none">
    {children}
  </ViewTransition>
);

export default SpendingViewTransition;
