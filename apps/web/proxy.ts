import { getCookieCache } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const session = await getCookieCache(request, {
    secret: process.env.AUTH_SECRET,
  });
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
