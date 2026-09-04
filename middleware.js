import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only check for root path
  if (pathname === '/') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If user is logged in, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
