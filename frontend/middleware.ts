import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';

export function middleware(request: NextRequest) {
  if (isOnlineBookingEnabledFromEnv()) return NextResponse.next();

  const match = request.nextUrl.pathname.match(/^\/checkout\/([^/]+)/);
  if (!match) return NextResponse.next();

  return NextResponse.redirect(new URL(`/discover/${match[1]}`, request.url));
}

export const config = {
  matcher: ['/checkout/:laundryId*'],
};
