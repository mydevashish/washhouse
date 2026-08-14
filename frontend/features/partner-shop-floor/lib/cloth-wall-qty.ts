/** Pure qty helpers for Cloth Wall line state (unit-tested). */

export type ClothWallProcess = 'dry_clean' | 'press' | 'single';

export type ClothWallLine = {
  /** Stable key: `catalog:{id}:{process}` or `service:{id}` */
  key: string;
  quantity: number;
  unitPriceInr: number;
  label: string;
  catalogItemId?: string;
  garmentItemId?: string;
  serviceId?: string;
  process?: ClothWallProcess;
};

export function catalogLineKey(catalogItemId: string, process: ClothWallProcess): string {
  return `catalog:${catalogItemId}:${process}`;
}

export function garmentLineKey(garmentItemId: string, process: ClothWallProcess): string {
  return `garment:${garmentItemId}:${process}`;
}

export function serviceLineKey(serviceId: string): string {
  return `service:${serviceId}`;
}

export function incrementClothWallQty(
  lines: ClothWallLine[],
  next: Omit<ClothWallLine, 'quantity'> & { quantity?: number },
  maxQty = 500,
): ClothWallLine[] {
  const existing = lines.find((l) => l.key === next.key);
  if (existing) {
    return lines.map((l) =>
      l.key === next.key
        ? { ...l, quantity: Math.min(maxQty, l.quantity + 1) }
        : l,
    );
  }
  return [...lines, { ...next, quantity: next.quantity ?? 1 }];
}

export function decrementClothWallQty(lines: ClothWallLine[], key: string): ClothWallLine[] {
  const existing = lines.find((l) => l.key === key);
  if (!existing) return lines;
  if (existing.quantity <= 1) {
    return lines.filter((l) => l.key !== key);
  }
  return lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity - 1 } : l));
}

export function setClothWallQty(
  lines: ClothWallLine[],
  key: string,
  quantity: number,
): ClothWallLine[] {
  if (quantity < 1) {
    return lines.filter((l) => l.key !== key);
  }
  return lines.map((l) => (l.key === key ? { ...l, quantity } : l));
}

export function clothWallPieceCount(lines: ClothWallLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function clothWallSubtotalInr(lines: ClothWallLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPriceInr * l.quantity, 0);
}
