import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/siteConfig';
import Link from 'next/link';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const Home = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <Button
        nativeButton={false}
        render={
          <Link href={siteConfig.baseLinks.appHome} className="m-auto">
            Go to dashboard
          </Link>
        }
      />
    </div>
  );
};

export default Home;
