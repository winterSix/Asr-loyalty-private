import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const isProd = process.env.NODE_ENV === 'production';
export const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

/** httpOnly cookie options for access token (15 min) */
export function accessTokenCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  };
}

/** httpOnly cookie options for refresh token (30 days) */
export function refreshTokenCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}

/** Safely extract backend error message */
export async function extractBackendError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.message || body?.error || `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}
