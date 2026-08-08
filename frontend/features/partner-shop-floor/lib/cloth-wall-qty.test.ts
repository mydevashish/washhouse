import {
  catalogLineKey,
  clothWallPieceCount,
  clothWallSubtotalInr,
  decrementClothWallQty,
  incrementClothWallQty,
  serviceLineKey,
  type ClothWallLine,
} from '@/features/partner-shop-floor/lib/cloth-wall-qty';

describe('cloth-wall-qty', () => {
  const shirt = {
    key: catalogLineKey('shirt-id', 'dry_clean'),
    unitPriceInr: 69,
    label: 'Shirt',
    catalogItemId: 'shirt-id',
    process: 'dry_clean' as const,
  };

  it('increments qty on repeated taps and decrements with −', () => {
    let lines: ClothWallLine[] = [];
    lines = incrementClothWallQty(lines, shirt);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe(1);

    lines = incrementClothWallQty(lines, shirt);
    expect(lines[0]?.quantity).toBe(2);
    expect(clothWallPieceCount(lines)).toBe(2);
    expect(clothWallSubtotalInr(lines)).toBe(138);

    lines = decrementClothWallQty(lines, shirt.key);
    expect(lines[0]?.quantity).toBe(1);

    lines = decrementClothWallQty(lines, shirt.key);
    expect(lines).toHaveLength(0);
  });

  it('keeps catalog and service lines on separate keys', () => {
    let lines: ClothWallLine[] = [];
    lines = incrementClothWallQty(lines, shirt);
    lines = incrementClothWallQty(lines, {
      key: serviceLineKey('svc-1'),
      unitPriceInr: 100,
      label: 'Wash & Fold',
      serviceId: 'svc-1',
    });
    expect(lines).toHaveLength(2);
    expect(clothWallPieceCount(lines)).toBe(2);
  });
});
