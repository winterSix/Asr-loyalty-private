import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '../_helpers';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (accessToken) {
      await fetch(`${BACKEND_URL}/auth/logout-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(() => {});
    }

    const response = NextResponse.json({ message: 'All sessions revoked' });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('userRole');
    return response;
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
