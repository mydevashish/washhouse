import { DiscoverMarketplace } from '@/features/discover/marketplace/discover-marketplace';

export const metadata = {
  title: 'Laundry service at your doorstep',
  description:
    'Find trusted laundries near you. Compare ratings, delivery time, and prices — then view services and book pickup.',
};

export default function DiscoverPage() {
  return <DiscoverMarketplace />;
}
