import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/siteConfig';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * This page must stay free of request-time reads so pages
 * can be prerendered
 */
const NotFoundPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <p className="mt-6 text-4xl font-semibold sm:text-5xl">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-50">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Button
        className="group mt-8"
        variant="ghost"
        nativeButton={false}
        render={
          <Link href={siteConfig.baseLinks.appHome}>
            Go to the home page
            <ArrowRight
              className="ml-1 size-5 text-gray-900 dark:text-gray-50"
              aria-hidden="true"
            />
          </Link>
        }
      />
    </div>
  );
};

export default NotFoundPage;
