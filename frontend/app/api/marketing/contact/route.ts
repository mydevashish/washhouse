import { marketingContactCreateSchema } from '@/lib/api/marketing';
import {
  marketingCatchResponse,
  marketingError,
  marketingSuccess,
  readJsonBody,
} from '@/lib/server/marketing-http';
import {
  checkMarketingRateLimit,
  sendMarketingContact,
} from '@/lib/server/marketing-mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!checkMarketingRateLimit(request)) {
    return marketingError('Too many contact requests. Please try again later.', 429);
  }

  try {
    const payload = marketingContactCreateSchema.parse(await readJsonBody(request));
    await sendMarketingContact(payload);
    return marketingSuccess('Your request has been submitted successfully.');
  } catch (error) {
    return marketingCatchResponse(
      error,
      'Could not send your message. Please try again later.',
    );
  }
}
