/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { StoresCard } from '@/features/marketing/stores/stores-card';
import { pickDirectionsUrl } from '@/lib/geo';
import { getContactInfo } from '@/services/customer-experience';

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
  useCardInView: () => ({ ref: { current: null }, inView: true }),
}));

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
  distanceIsApproximate: true,
  startPrice: null,
  image: '/catalog/store-cover.webp',
};

function renderCard(
  laundry: EnrichedLaundry = mockLaundry,
  props: { variant?: 'default' | 'featured' } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<StoresCard laundry={laundry} index={0} {...props} />, { wrapper });
}

describe('StoresCard', () => {
  beforeEach(() => {
    mockGetContactInfo.mockReset();
    mockGetContactInfo.mockResolvedValue({ ...CONTACT_WITH_ACTIONS });
  });

  it('renders name, city, cover image, and contact actions — no discover links', async () => {
    renderCard();

    expect(
      screen.getByRole('article', { name: /sparkle clean hub, bengaluru/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sparkle Clean Hub' })).toBeInTheDocument();
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();

    // Decorative cover (alt="") — still present as the card media plane
    const cover = document.querySelector('img[src="/catalog/store-cover.webp"]');
    expect(cover).not.toBeNull();

    // Approximate distance: city only, no km chip
    expect(screen.queryByText(/2\.4\s*km/i)).not.toBeInTheDocument();

    // Legacy directory chrome must not appear
    expect(screen.queryByText('4.8')).not.toBeInTheDocument();
    expect(screen.queryByText(/reviews/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: /washhouse services available/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/wash\s*&\s*fold/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open store/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open sparkle clean hub/i })).not.toBeInTheDocument();

    const discoverLinks = screen.queryAllByRole('link').filter((el) => {
      const href = el.getAttribute('href') ?? '';
      return /\/discover\//.test(href);
    });
    expect(discoverLinks).toHaveLength(0);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

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

  it('shows distance with city when GPS distance is real', () => {
    renderCard({
      ...mockLaundry,
      distanceIsApproximate: false,
      distanceKm: 1.5,
      city: 'Pune',
    });

    expect(screen.getByText('1.5 km')).toBeInTheDocument();
    expect(screen.getByText('Pune')).toBeInTheDocument();
  });

  it('opens map via window.open when Get Location is clicked', async () => {
    const user = userEvent.setup();
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    const expectedUrl =
      pickDirectionsUrl(CONTACT_WITH_ACTIONS) ?? CONTACT_WITH_ACTIONS.map_url;

    renderCard();

    const getLocation = await screen.findByRole('button', {
      name: /^get location for sparkle clean hub$/i,
    });
    await user.click(getLocation);

    expect(openSpy).toHaveBeenCalledWith(expectedUrl, '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('falls back to map_url when show_directions has no pickable coords', async () => {
    const user = userEvent.setup();
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    mockGetContactInfo.mockResolvedValue({
      ...CONTACT_WITH_ACTIONS,
      show_directions: false,
      latitude: null,
      longitude: null,
      google_maps_url: null,
      apple_maps_url: null,
      geo_url: null,
      map_url: 'https://maps.example/fallback-only',
    });

    renderCard();

    const getLocation = await screen.findByRole('button', {
      name: /^get location for sparkle clean hub$/i,
    });
    await user.click(getLocation);

    expect(openSpy).toHaveBeenCalledWith(
      'https://maps.example/fallback-only',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('shows Closest to you chip when variant is featured', () => {
    renderCard(mockLaundry, { variant: 'featured' });

    expect(screen.getByText('Closest to you')).toBeInTheDocument();
  });
});
