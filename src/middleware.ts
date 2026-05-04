import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken');
  // The accessToken cookie expires after 15 minutes but the refreshToken lasts 30 days.
  // Treat the user as authenticated if either cookie is present — the axios 401 interceptor
  // silently refreshes the access token on the next API call, so the middleware must not
  // redirect to login just because the short-lived accessToken cookie expired.
  const refreshToken = request.cookies.get('refreshToken');
  const isLoggedIn = !!accessToken || !!refreshToken;
  const userRole = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = [
    '/dashboard',
    '/transactions',
    '/rewards',
    '/profile',
    '/admin',
  ];
  const adminRoutes = ['/admin'];
  const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
  const authRoutes = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isRoot = pathname === '/';

  // Allow landing page to be accessible to everyone
  if (isRoot) {
    return NextResponse.next();
  }

  // Redirect to login only when both tokens are absent (truly unauthenticated)
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Block non-admin users from admin routes — redirect to dashboard
  if (isAdminRoute && isLoggedIn && userRole && !adminRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect to dashboard if accessing auth route while still authenticated
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


