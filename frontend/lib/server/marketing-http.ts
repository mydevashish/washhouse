import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { isSmtpNotConfiguredError } from '@/lib/server/marketing-mail';

export type MarketingApiResponse = {
  success: boolean;
  message: string;
};

export function marketingSuccess(
  message = 'Your request has been submitted successfully.',
  status = 200,
): NextResponse<MarketingApiResponse> {
  return NextResponse.json({ success: true, message }, { status });
}

export function marketingError(
  message: string,
  status: number,
): NextResponse<MarketingApiResponse> {
  return NextResponse.json({ success: false, message }, { status });
}

export function isMarketingValidationError(error: unknown): boolean {
  return error instanceof ZodError;
}

export function marketingCatchResponse(
  error: unknown,
  deliveryMessage: string,
): NextResponse<MarketingApiResponse> {
  if (error instanceof SyntaxError || isMarketingValidationError(error)) {
    return marketingError('Please check the required fields.', 400);
  }
  if (isSmtpNotConfiguredError(error)) {
    return marketingError(
      'Email is not configured on the server. Add SMTP settings in Vercel Production and redeploy.',
      503,
    );
  }
  return marketingError(deliveryMessage, 500);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new SyntaxError('Invalid JSON body');
  }
}
