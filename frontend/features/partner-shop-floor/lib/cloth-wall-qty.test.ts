import {
  buildWalkInItemsFromClothWallLines,
  catalogLineKey,
  clothWallPieceCount,
  clothWallSubtotalInr,
  decrementClothWallQty,
  incrementClothWallQty,
  lineAmountInr,
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

  it('computes decimal-safe line totals (1.5 × rate)', () => {
    expect(lineAmountInr(100, 1.5)).toBe(150);
    expect(lineAmountInr(69, 2.75)).toBe(189.75);
  });

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

  it('supports fractional kg increments (0.5)', () => {
    let lines: ClothWallLine[] = [];
    lines = incrementClothWallQty(lines, {
      key: serviceLineKey('wash-fold'),
      unitPriceInr: 80,
      label: 'Wash & Fold',
      serviceId: 'wash-fold',
    }, { delta: 0.5 });
    expect(lines[0]?.quantity).toBe(0.5);
    lines = incrementClothWallQty(lines, {
      key: serviceLineKey('wash-fold'),
      unitPriceInr: 80,
      label: 'Wash & Fold',
      serviceId: 'wash-fold',
    }, { delta: 0.5 });
    expect(lines[0]?.quantity).toBe(1);
    expect(clothWallSubtotalInr(lines)).toBe(80);
    lines = decrementClothWallQty(lines, serviceLineKey('wash-fold'), 0.5);
    expect(lines[0]?.quantity).toBe(0.5);
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

  it('maps garment catalog lines to garment_item_id payload', () => {
    const items = buildWalkInItemsFromClothWallLines([
      {
        key: 'garment:g1:dry_clean',
        quantity: 2,
        unitPriceInr: 59,
        label: 'T Shirt',
        garmentItemId: 'g1',
        process: 'dry_clean',
      },
    ]);
    expect(items).toEqual([
      { garment_item_id: 'g1', process: 'dry_clean', quantity: 2 },
    ]);
  });
});
