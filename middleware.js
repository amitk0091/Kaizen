import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Root path: redirect to dashboard if logged in
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Dashboard: redirect to login if not logged in
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Login/Signup: redirect to dashboard if already logged in
  if ((pathname === '/login' || pathname === '/signup') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/signup'],
};
