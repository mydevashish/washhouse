/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { StoresCard } from '@/features/marketing/stores/stores-card';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    alt,
    fill: _fill,
    ...props
  }: {
    alt?: string;
    fill?: boolean;
    src?: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img alt={alt ?? ''} {...props} />;
  },
}));

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');

  function passthrough(tag: keyof JSX.IntrinsicElements) {
    return React.forwardRef(function MotionPassthrough(
      {
        children,
        initial: _initial,
        animate: _animate,
        whileHover: _whileHover,
        transition: _transition,
        ...rest
      }: {
        children?: React.ReactNode;
        initial?: unknown;
        animate?: unknown;
        whileHover?: unknown;
        transition?: unknown;
        className?: string;
        'aria-label'?: string;
      },
      ref: React.Ref<HTMLElement>,
    ) {
      return React.createElement(tag, { ...rest, ref }, children);
    });
  }

  return {
    motion: {
      article: passthrough('article'),
      div: passthrough('div'),
      span: passthrough('span'),
    },
    useReducedMotion: () => true,
  };
});

jest.mock('@/features/marketing/stores/use-card-in-view', () => ({
  useCardInView: () => ({ ref: { current: null }, inView: false }),
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (select: (s: { user: null }) => unknown) => select({ user: null }),
}));

jest.mock('@/services/customer-experience', () => ({
  getContactInfo: jest.fn(),
  trackContactEvent: jest.fn(),
}));

jest.mock('@/services/laundries', () => ({
  getLaundry: jest.fn(),
}));

const mockLaundry: EnrichedLaundry = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Sparkle Clean Hub',
  slug: 'sparkle-clean-hub',
  city: 'Bengaluru',
  avg_rating: '4.8',
  review_count: 42,
  is_verified: true,
  distanceKm: 2.4,
  deliveryHours: 24,
  distanceIsApproximate: true,
  startPrice: null,
  image: '/catalog/store-cover.webp',
};

function renderCard(laundry: EnrichedLaundry = mockLaundry) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<StoresCard laundry={laundry} index={0} />, { wrapper });
}

describe('StoresCard', () => {
  it('renders key fields from EnrichedLaundry (name, city, rating, services, open link)', () => {
    renderCard();

    expect(
      screen.getByRole('article', { name: /sparkle clean hub, bengaluru/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sparkle Clean Hub' })).toBeInTheDocument();
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText(/reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/24 hour delivery/i)).toBeInTheDocument();

    expect(
      screen.getByRole('list', { name: /washhouse services available/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Wash & Fold')).toBeInTheDocument();

    const openStore = screen.getByRole('link', { name: /^open store$/i });
    expect(openStore).toHaveAttribute(
      'href',
      '/discover/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(screen.getByRole('link', { name: /open sparkle clean hub/i })).toHaveAttribute(
      'href',
      '/discover/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });

  it('shows distance with city when GPS distance is real', () => {
    renderCard({
      ...mockLaundry,
      distanceIsApproximate: false,
      distanceKm: 1.5,
      city: 'Pune',
    });

    expect(screen.getByText(/1\.5 km · Pune/)).toBeInTheDocument();
  });
});
