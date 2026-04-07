import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, accessTokenCookieOptions, refreshTokenCookieOptions, extractBackendError } from '../_helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const payload = data?.data ?? data;

    // 2FA pending — return partial response without setting token cookies
    if (payload?.requiresTwoFactor) {
      return NextResponse.json(payload);
    }

    const { accessToken, refreshToken, user, ...rest } = payload;

    const response = NextResponse.json({ user, ...rest });

    if (accessToken) {
      response.cookies.set('accessToken', accessToken, accessTokenCookieOptions());
    }
    if (refreshToken) {
      response.cookies.set('refreshToken', refreshToken, refreshTokenCookieOptions());
    }
    if (user?.role) {
      response.cookies.set('userRole', user.role, {
        httpOnly: false, // readable by middleware
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
