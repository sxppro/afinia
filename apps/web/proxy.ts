import { auth } from '@/lib/auth/config';
import { siteConfig } from '@/lib/siteConfig';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy runs before any route is served
 */
export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.redirect(
      new URL(siteConfig.baseLinks.login, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
