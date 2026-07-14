import { redirect } from 'next/navigation';

import { CheckoutView } from '@/features/checkout/checkout-view';
import {
  fetchOnlineBookingEnabledFromApi,
  isOnlineBookingEnabledFromEnv,
  resolveOnlineBookingEnabled,
} from '@/lib/online-booking';

type PageProps = {
  params: Promise<{ laundryId: string }>;
};

async function isOnlineBookingEnabled(): Promise<boolean> {
  const envAllows = isOnlineBookingEnabledFromEnv();
  const apiEnabled = await fetchOnlineBookingEnabledFromApi();
  return resolveOnlineBookingEnabled(envAllows, apiEnabled);
}

export default async function CheckoutPage({ params }: PageProps) {
  const { laundryId } = await params;
  if (!(await isOnlineBookingEnabled())) {
    redirect(`/discover/${laundryId}`);
  }
  return <CheckoutView laundryId={laundryId} />;
}
