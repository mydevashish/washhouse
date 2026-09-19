import { NextResponse } from 'next/server';

import { marketingFranchiseInquiryCreateSchema } from '@/lib/api/marketing';
import {
  checkMarketingRateLimit,
  sendMarketingFranchiseInquiry,
} from '@/lib/server/marketing-mail';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!checkMarketingRateLimit(request)) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many franchise inquiries. Please try again later.' } },
      { status: 429 },
    );
  }

  try {
    const payload = marketingFranchiseInquiryCreateSchema.parse(await request.json());
    await sendMarketingFranchiseInquiry(payload);
    return NextResponse.json({ data: { id: crypto.randomUUID(), status: 'received' } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Please check the submitted fields.' } },
        { status: 422 },
      );
    }
    console.error('marketing.franchise_email.failed', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: { code: 'EMAIL_DELIVERY_FAILED', message: 'Could not submit your application. Please try again later.' } },
      { status: 502 },
    );
  }
}