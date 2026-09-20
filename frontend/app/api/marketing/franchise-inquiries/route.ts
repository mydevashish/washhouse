import { marketingFranchiseInquiryCreateSchema } from '@/lib/api/marketing';
import {
  marketingCatchResponse,
  marketingError,
  marketingSuccess,
  readJsonBody,
} from '@/lib/server/marketing-http';
import {
  checkMarketingRateLimit,
  sendMarketingFranchiseInquiry,
} from '@/lib/server/marketing-mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!checkMarketingRateLimit(request)) {
    return marketingError('Too many franchise inquiries. Please try again later.', 429);
  }

  try {
    const payload = marketingFranchiseInquiryCreateSchema.parse(await readJsonBody(request));
    await sendMarketingFranchiseInquiry(payload);
    return marketingSuccess('Your request has been submitted successfully.');
  } catch (error) {
    return marketingCatchResponse(
      error,
      'Could not submit your application. Please try again later.',
    );
  }
}
