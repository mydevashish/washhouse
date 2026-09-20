import { marketingBookNowCreateSchema } from '@/lib/api/marketing';
import {
  isMarketingValidationError,
  marketingError,
  marketingSuccess,
  readJsonBody,
} from '@/lib/server/marketing-http';
import {
  checkMarketingRateLimit,
  sendMarketingBookNow,
} from '@/lib/server/marketing-mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!checkMarketingRateLimit(request)) {
    return marketingError('Too many pickup requests. Please try again later.', 429);
  }

  try {
    const payload = marketingBookNowCreateSchema.parse(await readJsonBody(request));
    await sendMarketingBookNow(payload);
    return marketingSuccess('Your request has been submitted successfully.');
  } catch (error) {
    if (error instanceof SyntaxError || isMarketingValidationError(error)) {
      return marketingError('Please check the required fields.', 400);
    }
    console.error('marketing.book_now_email.failed', error instanceof Error ? error.message : 'unknown');
    return marketingError('Could not send your pickup request. Please try again later.', 500);
  }
}