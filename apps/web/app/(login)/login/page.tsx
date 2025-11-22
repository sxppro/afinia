import LoginForm from '@/components/misc/login-form';
import { buttonVariants } from '@/components/ui/button';
import { siteConfig } from '@/lib/siteConfig';
import { cn } from '@/lib/ui';
import { ArrowLeft, GalleryVerticalEnd } from 'lucide-react';
import Link from 'next/link';

const Login = () => {
  return (
    <div className="relative bg-muted flex min-h-svh flex-col items-center justify-center gap-6 px-3">
      <Link
        href={siteConfig.baseLinks.home}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-4 top-4 md:left-8 md:top-8'
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Go back
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Afinia
        </a>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
