/**
 * @jest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react';

const mockUseInView = jest.fn(() => false);
const mockUseReducedMotion = jest.fn(() => false);

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');

  const MockMotion = React.forwardRef(function MockMotion(
    {
      children,
      animate,
      initial,
      className,
    }: {
      children?: React.ReactNode;
      animate?: string;
      initial?: string;
      className?: string;
    },
    ref: React.Ref<HTMLDivElement>,
  ) {
    return (
      <div
        ref={ref}
        className={className}
        data-animate={animate ?? ''}
        data-initial={initial ?? ''}
      >
        {children}
      </div>
    );
  });

  return {
    motion: { div: MockMotion },
    useInView: () => mockUseInView(),
    useReducedMotion: () => mockUseReducedMotion(),
  };
});

import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';

describe('FadeIn visibility safety', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseInView.mockReturnValue(false);
    mockUseReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('forces visible when IntersectionObserver never fires', () => {
    render(
      <FadeIn>
        <FadeInItem>
          <a href="/stores">Browse stores</a>
        </FadeInItem>
      </FadeIn>,
    );

    const link = screen.getByRole('link', { name: 'Browse stores' });
    const item = link.parentElement;
    expect(item).toHaveAttribute('data-animate', '');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(item).toHaveAttribute('data-animate', 'visible');
  });

  it('renders plain visible markup when prefers-reduced-motion', () => {
    mockUseReducedMotion.mockReturnValue(true);

    render(
      <FadeIn>
        <FadeInItem>
          <button type="button">Book Now</button>
        </FadeInItem>
      </FadeIn>,
    );

    expect(screen.getByRole('button', { name: 'Book Now' })).toBeVisible();
    expect(document.querySelector('[data-animate]')).toBeNull();
  });

  it('becomes visible immediately when already in view', () => {
    mockUseInView.mockReturnValue(true);

    render(
      <FadeIn>
        <span>In view content</span>
      </FadeIn>,
    );

    const root = screen.getByText('In view content').parentElement;
    expect(root).toHaveAttribute('data-animate', 'visible');
  });
});
