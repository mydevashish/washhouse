import { LaundryStorefrontView } from '@/features/storefront/laundry-storefront-view';

export const metadata = { title: 'Laundry shop' };

export default async function LaundryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LaundryStorefrontView laundryId={id} />;
}
