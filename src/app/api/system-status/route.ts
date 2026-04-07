import { NextResponse } from 'next/server';

/**
 * Proxy the system status check through Next.js so the backend URL is never
 * exposed to browser clients and CORS configuration stays simple.
 */
export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';
    const res = await fetch(`${apiUrl}/system-settings/status`, {
      next: { revalidate: 30 }, // cache for 30 seconds
    });

    if (!res.ok) {
      return NextResponse.json({ maintenanceMode: false }, { status: 200 });
    }

    const body = await res.json();
    const status = body?.data ?? body;

    return NextResponse.json({
      maintenanceMode: !!status?.maintenanceMode,
    });
  } catch {
    // If backend is unreachable, assume not in maintenance to avoid blocking logins
    return NextResponse.json({ maintenanceMode: false }, { status: 200 });
  }
}
