
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { type User } from '@prisma/client';

const ADMIN_ONLY_PATHS = ['/purchases', '/payments'];

export default auth((req) => {
  const user = req.auth?.user as User | undefined;
  const url = req.nextUrl;
  const pathname = url.pathname;

  // If the user is not logged in, they are already redirected by default by the matcher.
  if (!user) {
    return NextResponse.next();
  }

  // 1. Setup flow for first-time admin users
  if (user && !user.companyName && pathname !== '/setup') {
    return NextResponse.redirect(new URL('/setup', req.url));
  }
  if (user && user.companyName && pathname === '/setup') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 2. Role-Based Access Control
  const isUserAdmin = user.role === 'ADMIN';
  if (!isUserAdmin && ADMIN_ONLY_PATHS.some(path => pathname.startsWith(path))) {
    // Redirect non-admins trying to access admin-only pages
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});


export const config = {
  // Match all routes except for static files, API routes, and the login page
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
