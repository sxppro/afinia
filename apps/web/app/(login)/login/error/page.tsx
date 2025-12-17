import { getServerSession } from '@/lib/auth/session';
import { siteConfig } from '@/lib/siteConfig';
import { X } from 'lucide-react';
import { redirect } from 'next/navigation';

const LoginError = async () => {
  const session = await getServerSession();

  if (session) {
    redirect(siteConfig.baseLinks.appHome);
  }

  return (
    <div className="flex h-screen">
      <div className="flex flex-col items-center gap-2 m-auto">
        <X className="h-8 w-8" />
        <h1 className="text-xl tracking-tight">Unable to sign in</h1>
      </div>
    </div>
  );
};

export default LoginError;
