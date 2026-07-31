/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { QuickPickCompactRow } from '@/features/marketing/stores/quick-pick-compact-row';
import { QuickPickSkeleton } from '@/features/marketing/stores/quick-pick-skeleton';
import { QuickPickSpotlight } from '@/features/marketing/stores/quick-pick-spotlight';
import { getContactInfo } from '@/services/customer-experience';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    onClick,
    ...rest
  }: {
    children?: React.ReactNode;
    href: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    className?: string;
    'aria-label'?: string;
  }) {
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  },
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
  getContactInfo: jest.fn(),
  trackContactEvent: jest.fn(),
}));

const mockGetContactInfo = getContactInfo as jest.MockedFunction<typeof getContactInfo>;

const CONTACT_WITH_ACTIONS = {
  can_contact: true,
  contact_available: true,
  requires_login: false,
  show_call: true,
  show_whatsapp: true,
  show_callback: false,
  show_directions: true,
  phone: '+919999999999',
  whatsapp_number: '+919999999999',
  whatsapp_url: 'https://wa.me/919999999999',
  latitude: 12.9716,
  longitude: 77.5946,
  map_url: 'https://maps.example/sparkle',
  google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946',
  apple_maps_url: 'https://maps.apple.com/?daddr=12.9716,77.5946',
  geo_url: 'geo:12.9716,77.5946',
};

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
  beforeEach(() => {
    mockGetContactInfo.mockReset();
    mockGetContactInfo.mockResolvedValue({ ...CONTACT_WITH_ACTIONS });
  });

  it('renders place line, from-price, rating, desktop-only discover link, and contact actions', async () => {
    withQuery(<QuickPickSpotlight laundry={mockLaundry} />);

    expect(
      screen.getByRole('article', { name: /sparkle clean hub, bengaluru/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sparkle Clean Hub' })).toBeInTheDocument();
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    expect(screen.getByText('2.4 km')).toBeInTheDocument();
    expect(screen.getByText('From ₹149')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();

    // TODO: re-enable store navigation on mobile when ready — link is CSS-gated (`max-lg:hidden`)
    const discoverLink = screen.getByRole('link', { name: /open sparkle clean hub/i });
    expect(discoverLink).toHaveAttribute('href', `/discover/${mockLaundry.id}`);
    expect(discoverLink).toHaveClass('max-lg:hidden');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /call store for sparkle clean hub/i }),
      ).toBeInTheDocument();
    });

    expect(mockGetContactInfo).toHaveBeenCalledWith(mockLaundry.id);
    expect(
      screen.getByRole('group', { name: /actions for sparkle clean hub/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /call store for sparkle clean hub/i }),
    ).toHaveTextContent('Call Store');
    expect(
      screen.getByRole('button', { name: /message store for sparkle clean hub/i }),
    ).toHaveTextContent('Message Store');
    expect(
      screen.getByRole('button', { name: /get location for sparkle clean hub/i }),
    ).toHaveTextContent('Get Location');
  });

  it('invokes onNavigate when the desktop store cover link is clicked', () => {
    const onNavigate = jest.fn();
    withQuery(
      <QuickPickSpotlight laundry={mockLaundry} onNavigate={onNavigate} />,
    );

    fireEvent.click(screen.getByRole('link', { name: /open sparkle clean hub/i }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
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
  beforeEach(() => {
    mockGetContactInfo.mockReset();
    mockGetContactInfo.mockResolvedValue({ ...CONTACT_WITH_ACTIONS });
  });

  it('renders name, city + distance, desktop-only discover link, and contact actions', async () => {
    withQuery(
      <ul>
        <QuickPickCompactRow laundry={mockLaundry} index={0} />
      </ul>,
    );

    expect(
      screen.getByRole('listitem', { name: /sparkle clean hub, bengaluru/i }),
    ).toBeInTheDocument();

    // TODO: re-enable store navigation on mobile when ready — link is CSS-gated (`max-lg:hidden`)
    const discoverLink = screen.getByRole('link', { name: /open sparkle clean hub/i });
    expect(discoverLink).toHaveAttribute('href', `/discover/${mockLaundry.id}`);
    expect(discoverLink).toHaveClass('max-lg:hidden');

    expect(screen.getByText('Sparkle Clean Hub')).toBeInTheDocument();
    expect(screen.getByText('2.4 km')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) =>
          el?.classList.contains('truncate') && el.textContent?.includes('Bengaluru') === true,
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /call store for sparkle clean hub/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('group', { name: /actions for sparkle clean hub/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /call store for sparkle clean hub/i }),
    ).toHaveTextContent('Call Store');
    expect(
      screen.getByRole('button', { name: /message store for sparkle clean hub/i }),
    ).toHaveTextContent('Message Store');
    expect(
      screen.getByRole('button', { name: /get location for sparkle clean hub/i }),
    ).toHaveTextContent('Get Location');
  });

  it('invokes onNavigate when the desktop thumb/name link is clicked', () => {
    const onNavigate = jest.fn();
    withQuery(
      <ul>
        <QuickPickCompactRow
          laundry={mockLaundry}
          index={0}
          onNavigate={onNavigate}
        />
      </ul>,
    );

    fireEvent.click(screen.getByRole('link', { name: /open sparkle clean hub/i }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
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
