import { NextResponse } from 'next/server';

import { marketingBookNowCreateSchema } from '@/lib/api/marketing';
import {
  checkMarketingRateLimit,
  sendMarketingBookNow,
} from '@/lib/server/marketing-mail';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!checkMarketingRateLimit(request)) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many pickup requests. Please try again later.' } },
      { status: 429 },
    );
  }

  try {
    const payload = marketingBookNowCreateSchema.parse(await request.json());
    await sendMarketingBookNow(payload);
    return NextResponse.json(
      { data: { id: crypto.randomUUID(), status: 'received' } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Please check the submitted fields.' } },
        { status: 422 },
      );
    }
    console.error('marketing.book_now_email.failed', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: { code: 'EMAIL_DELIVERY_FAILED', message: 'Could not send your pickup request. Please try again later.' } },
      { status: 502 },
    );
  }
}