import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken');
  const { pathname } = request.nextUrl;
  
  // Debug: Log all cookies
  const allCookies = request.cookies.getAll();
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] All cookies:', allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' || 'empty' })));
  }

  // Protected routes
  const protectedRoutes = [
    '/dashboard',
    '/transactions',
    '/rewards',
    '/profile',
    '/admin',
  ];
  const authRoutes = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isRoot = pathname === '/';

  // Log middleware execution (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware]', {
      pathname,
      hasToken: !!accessToken,
      tokenValue: accessToken?.value?.substring(0, 20) + '...' || null,
      isProtectedRoute,
      isAuthRoute,
      isRoot
    });
  }

  // Allow landing page to be accessible to everyone
  if (isRoot) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !accessToken) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Redirecting to /login - no token for protected route');
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if accessing auth route with token
  if (isAuthRoute && accessToken) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Redirecting to /dashboard - token found on auth route');
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


