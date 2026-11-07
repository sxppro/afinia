import { getServerSession } from '@/lib/auth/session';
import { siteConfig } from '@/lib/siteConfig';
import { X } from 'lucide-react';
import { redirect } from 'next/navigation';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
