import { marketingContactCreateSchema } from '@/lib/api/marketing';
import {
  isMarketingValidationError,
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

export async function POST(request: Request) {
  if (!checkMarketingRateLimit(request)) {
    return marketingError('Too many contact requests. Please try again later.', 429);
  }

  try {
    const payload = marketingContactCreateSchema.parse(await readJsonBody(request));
    await sendMarketingContact(payload);
    return marketingSuccess('Your request has been submitted successfully.');
  } catch (error) {
    if (error instanceof SyntaxError || isMarketingValidationError(error)) {
      return marketingError('Please check the required fields.', 400);
    }
    console.error('marketing.contact_email.failed', error instanceof Error ? error.message : 'unknown');
    return marketingError('Could not send your message. Please try again later.', 500);
  }
}