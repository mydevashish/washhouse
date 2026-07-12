import { redirect } from 'next/navigation';

import { CheckoutView } from '@/features/checkout/checkout-view';
import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';

type PageProps = {
  params: Promise<{ laundryId: string }>;
};

async function isOnlineBookingEnabled(): Promise<boolean> {
  if (!isOnlineBookingEnabledFromEnv()) return false;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/config`, { cache: 'no-store' });
    if (!res.ok) return isOnlineBookingEnabledFromEnv();
    const json = (await res.json()) as { data?: { online_booking_enabled?: boolean } };
    return json.data?.online_booking_enabled ?? true;
  } catch {
    return isOnlineBookingEnabledFromEnv();
  }
}

export default async function CheckoutPage({ params }: PageProps) {
  const { laundryId } = await params;
  if (!(await isOnlineBookingEnabled())) {
    redirect(`/discover/${laundryId}`);
  }
  return <CheckoutView laundryId={laundryId} />;
}
