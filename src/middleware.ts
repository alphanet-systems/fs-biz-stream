import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { type User } from '@prisma/client';

export default auth((req) => {
  const user = req.auth?.user as User | undefined;
  const url = req.nextUrl;

  // If the user is logged in for the first time and has no company info,
  // redirect them to the setup page, unless they are already on it.
  if (user && !user.companyName && url.pathname !== '/setup') {
    return NextResponse.redirect(new URL('/setup', req.url));
  }

  // If a user who has already set up tries to access the setup page,
  // redirect them to the dashboard.
  if (user && user.companyName && url.pathname === '/setup') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});


export const config = {
  // Match all routes except for static files, API routes, and the login page
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
