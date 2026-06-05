import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/siteConfig';
import Link from 'next/link';

const Home = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <Button
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
