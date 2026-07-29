/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { QuickPickCompactRow } from '@/features/marketing/stores/quick-pick-compact-row';
import { QuickPickSkeleton } from '@/features/marketing/stores/quick-pick-skeleton';
import { QuickPickSpotlight } from '@/features/marketing/stores/quick-pick-spotlight';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    alt,
    fill: _fill,
    priority: _priority,
    ...props
  }: {
    alt?: string;
    fill?: boolean;
    priority?: boolean;
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
        transition: _transition,
        ...rest
      }: {
        children?: React.ReactNode;
        initial?: unknown;
        animate?: unknown;
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
      li: passthrough('li'),
      span: passthrough('span'),
    },
    useReducedMotion: () => true,
  };
});

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (select: (s: { user: null }) => unknown) => select({ user: null }),
}));

jest.mock('@/services/customer-experience', () => ({
  getContactInfo: jest.fn().mockResolvedValue({
    contact_available: true,
    show_call: true,
    show_whatsapp: true,
    requires_login: false,
    phone: '+919999999999',
    whatsapp_url: 'https://wa.me/919999999999',
  }),
  trackContactEvent: jest.fn(),
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
  distanceIsApproximate: false,
  startPrice: 149,
  image: '/catalog/store-cover.webp',
};

function withQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper });
}

describe('QuickPickSpotlight', () => {
  it('renders Open store, place line, from-price, and rating when present', () => {
    withQuery(<QuickPickSpotlight laundry={mockLaundry} />);

    expect(
      screen.getByRole('article', { name: /sparkle clean hub, bengaluru/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sparkle Clean Hub' })).toBeInTheDocument();
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    expect(screen.getByText('2.4 km')).toBeInTheDocument();
    expect(screen.getByText('From ₹149')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();

    const open = screen.getByRole('link', { name: /open store/i });
    expect(open).toHaveAttribute(
      'href',
      '/discover/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });

  it('hides rating badge when rating is missing', () => {
    withQuery(
      <QuickPickSpotlight laundry={{ ...mockLaundry, avg_rating: '' }} />,
    );

    expect(screen.queryByText('4.8')).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });
});

describe('QuickPickCompactRow', () => {
  it('renders name, city + distance, and open link', () => {
    withQuery(
      <ul>
        <QuickPickCompactRow laundry={mockLaundry} index={0} />
      </ul>,
    );

    expect(screen.getByRole('link', { name: /open sparkle clean hub/i })).toHaveAttribute(
      'href',
      '/discover/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(screen.getByText('Sparkle Clean Hub')).toBeInTheDocument();
    expect(screen.getByText('2.4 km')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.classList.contains('truncate') && el.textContent?.includes('Bengaluru') === true)).toBeInTheDocument();
  });
});

describe('QuickPickSkeleton', () => {
  it('exposes a layout-matched loading status', () => {
    render(<QuickPickSkeleton />);
    expect(
      screen.getByRole('status', { name: /loading nearby stores/i }),
    ).toBeInTheDocument();
  });
});
