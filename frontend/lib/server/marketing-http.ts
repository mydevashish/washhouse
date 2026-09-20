import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

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

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new SyntaxError('Invalid JSON body');
  }
}
