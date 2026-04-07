import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, accessTokenCookieOptions, refreshTokenCookieOptions } from '../_helpers';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!backendRes.ok) {
      // Refresh failed — clear cookies
      const response = NextResponse.json({ message: 'Session expired' }, { status: 401 });
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      response.cookies.delete('userRole');
      return response;
    }

    const data = await backendRes.json();
    const payload = data?.data ?? data;
    const { accessToken, refreshToken: newRefreshToken } = payload;

    // Return the access token to the client (stored in memory) and update cookies
    const response = NextResponse.json({ accessToken });

    if (accessToken) {
      response.cookies.set('accessToken', accessToken, accessTokenCookieOptions());
    }
    if (newRefreshToken) {
      response.cookies.set('refreshToken', newRefreshToken, refreshTokenCookieOptions());
    }

    return response;
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
