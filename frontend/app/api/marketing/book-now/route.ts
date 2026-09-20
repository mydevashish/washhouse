import { marketingBookNowCreateSchema } from '@/lib/api/marketing';
import {
  marketingCatchResponse,
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
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!checkMarketingRateLimit(request)) {
    return marketingError('Too many pickup requests. Please try again later.', 429);
  }

  try {
    const payload = marketingBookNowCreateSchema.parse(await readJsonBody(request));
    await sendMarketingBookNow(payload);
    return marketingSuccess('Your request has been submitted successfully.');
  } catch (error) {
    return marketingCatchResponse(
      error,
      'Could not send your pickup request. Please try again later.',
    );
  }
}
