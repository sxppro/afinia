import { cn } from '@/lib/ui';
import { PropsWithChildren, useEffect, useRef } from 'react';

const ScrollableContent = ({
  className,
  children,
  hideScrollbar = false,
}: { className?: string; hideScrollbar?: boolean } & PropsWithChildren) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomGradientRef = useRef<HTMLDivElement>(null);
  const topGradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const topGradient = topGradientRef.current;
    const bottomGradient = bottomGradientRef.current;
    if (!scrollContainer || !bottomGradient || !topGradient) return;

    const handleScroll = () => {
      const maxScroll =
        scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const currentScroll = scrollContainer.scrollTop;

      const topOpacity = Math.min(currentScroll / 100, 1);
      const bottomOpacity = Math.min((maxScroll - currentScroll) / 100, 1);

      topGradient.style.opacity = topOpacity.toString();
      bottomGradient.style.opacity = bottomOpacity.toString();
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <div
        ref={scrollContainerRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overscroll-contain',
          hideScrollbar ? 'scrollbar-hidden' : ''
        )}
      >
        {children}
      </div>
      <div
        ref={topGradientRef}
        className="from-background pointer-events-none absolute top-0 left-0 h-16 w-full bg-gradient-to-b"
        style={{ opacity: 0 }}
      />
      <div
        ref={bottomGradientRef}
        className="from-background pointer-events-none absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t"
        style={{ opacity: 1 }}
      />
    </div>
  );
};

export default ScrollableContent;
