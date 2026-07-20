import { getImageProps } from 'next/image';

import { neighborRackIndexes } from '@/features/marketing/pricing/lib/neighbor-rack-indexes';
import {
  clearPricingPhotoPrefetchQueue,
  enqueuePricingPhotoPrefetch,
  pickPricingPhotoPrefetchCandidate,
  PRICING_CATEGORY_PHOTO_SIZES,
  PRICING_PHOTO_PREFETCH_CONCURRENCY,
  PRICING_PHOTO_PREFETCH_HEIGHT,
  PRICING_PHOTO_PREFETCH_WIDTH,
  resetPricingPhotoPrefetchStateForTests,
} from '@/features/marketing/pricing/lib/prefetch-pricing-product-image';

describe('neighborRackIndexes', () => {
  it('returns empty for empty racks', () => {
    expect(neighborRackIndexes(0, 0)).toEqual([]);
  });

  it('returns only +1 at the start', () => {
    expect(neighborRackIndexes(0, 5)).toEqual([1]);
  });

  it('returns only −1 at the end', () => {
    expect(neighborRackIndexes(4, 5)).toEqual([3]);
  });

  it('returns ±1 in the middle', () => {
    expect(neighborRackIndexes(2, 5)).toEqual([1, 3]);
  });

  it('clamps an out-of-range active index', () => {
    expect(neighborRackIndexes(-3, 4)).toEqual([1]);
    expect(neighborRackIndexes(99, 4)).toEqual([2]);
  });
});

describe('pickPricingPhotoPrefetchCandidate', () => {
  it('resolves local /catalog/ WebP paths through the next/image optimizer', () => {
    const { props } = getImageProps({
      alt: '',
      src: '/catalog/men/shirt.webp',
      width: PRICING_PHOTO_PREFETCH_WIDTH,
      height: PRICING_PHOTO_PREFETCH_HEIGHT,
      sizes: PRICING_CATEGORY_PHOTO_SIZES,
    });
    const picked = pickPricingPhotoPrefetchCandidate(props.src, props.srcSet);
    expect(picked).toMatch(/^\/_next\/image\?url=%2Fcatalog%2F/);
    expect(picked).toContain('w=1080');
  });

  it('falls back to src when srcSet is missing', () => {
    expect(pickPricingPhotoPrefetchCandidate('/a.jpg')).toBe('/a.jpg');
  });

  it('prefers the first candidate at or above 1080w', () => {
    const srcSet =
      '/_next/image?url=a&w=640&q=75 640w, /_next/image?url=a&w=1080&q=75 1080w, /_next/image?url=a&w=1920&q=75 1920w';
    expect(pickPricingPhotoPrefetchCandidate('/fallback', srcSet)).toBe(
      '/_next/image?url=a&w=1080&q=75',
    );
  });

  it('uses the largest candidate when none reach 1080w', () => {
    const srcSet =
      '/_next/image?url=a&w=640&q=75 640w, /_next/image?url=a&w=750&q=75 750w';
    expect(pickPricingPhotoPrefetchCandidate('/fallback', srcSet)).toBe(
      '/_next/image?url=a&w=750&q=75',
    );
  });
});

describe('enqueuePricingPhotoPrefetch concurrency', () => {
  class FakeImage {
    static active = 0;
    static peak = 0;
    static instances: FakeImage[] = [];

    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    decoding = '';
    #src = '';

    constructor() {
      FakeImage.instances.push(this);
    }

    get src() {
      return this.#src;
    }

    set src(value: string) {
      this.#src = value;
      FakeImage.active += 1;
      FakeImage.peak = Math.max(FakeImage.peak, FakeImage.active);
    }

    completeLoad() {
      FakeImage.active -= 1;
      this.onload?.();
    }
  }

  beforeEach(() => {
    resetPricingPhotoPrefetchStateForTests();
    FakeImage.active = 0;
    FakeImage.peak = 0;
    FakeImage.instances = [];
    // @ts-expect-error test double for window.Image
    global.Image = FakeImage;
  });

  afterEach(() => {
    resetPricingPhotoPrefetchStateForTests();
  });

  it(`never starts more than ${PRICING_PHOTO_PREFETCH_CONCURRENCY} loads at once`, () => {
    enqueuePricingPhotoPrefetch('/a');
    enqueuePricingPhotoPrefetch('/b');
    enqueuePricingPhotoPrefetch('/c');
    enqueuePricingPhotoPrefetch('/d');

    expect(FakeImage.instances).toHaveLength(PRICING_PHOTO_PREFETCH_CONCURRENCY);
    expect(FakeImage.peak).toBe(PRICING_PHOTO_PREFETCH_CONCURRENCY);

    FakeImage.instances[0]?.completeLoad();
    expect(FakeImage.instances).toHaveLength(PRICING_PHOTO_PREFETCH_CONCURRENCY + 1);

    FakeImage.instances[1]?.completeLoad();
    FakeImage.instances[2]?.completeLoad();
    expect(FakeImage.instances).toHaveLength(4);
    expect(FakeImage.peak).toBe(PRICING_PHOTO_PREFETCH_CONCURRENCY);
  });

  it('clearPricingPhotoPrefetchQueue drops not-yet-started urls', () => {
    enqueuePricingPhotoPrefetch('/a');
    enqueuePricingPhotoPrefetch('/b');
    enqueuePricingPhotoPrefetch('/c');
    clearPricingPhotoPrefetchQueue();

    FakeImage.instances[0]?.completeLoad();
    FakeImage.instances[1]?.completeLoad();

    expect(FakeImage.instances).toHaveLength(PRICING_PHOTO_PREFETCH_CONCURRENCY);
  });
});
