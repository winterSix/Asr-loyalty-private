import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken');
  const { pathname } = request.nextUrl;
  
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

  // Allow landing page to be accessible to everyone
  if (isRoot) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if accessing auth route with token
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


