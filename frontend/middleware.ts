import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge middleware must be self-contained (no @/ imports — Vercel Edge bundler).
// Keep in sync with lib/online-booking.ts
function isOnlineBookingEnabledFromEnv(): boolean {
  const value = process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING;
  if (value === undefined || value === '') return true;
  return value === '1' || value.toLowerCase() === 'true';
}

export function middleware(request: NextRequest) {
  if (isOnlineBookingEnabledFromEnv()) return NextResponse.next();

  const match = request.nextUrl.pathname.match(/^\/checkout\/([^/]+)/);
  if (!match) return NextResponse.next();

  return NextResponse.redirect(new URL(`/discover/${match[1]}`, request.url));
}

export const config = {
  matcher: ['/checkout/:laundryId*'],
};
