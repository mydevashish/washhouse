/** Pure qty helpers for Cloth Wall line state (unit-tested). */

import type { WalkInOrderLineItem } from '@/services/partner-walk-in-orders';

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

export const CLOTH_WALL_MIN_QTY = 0.01;

export function roundClothWallQty(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineAmountInr(rate: number, qty: number): number {
  return roundClothWallQty(rate * qty);
}

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
  options?: { maxQty?: number; delta?: number },
): ClothWallLine[] {
  const maxQty = options?.maxQty ?? 500;
  const delta = options?.delta ?? next.quantity ?? 1;
  const existing = lines.find((l) => l.key === next.key);
  if (existing) {
    return lines.map((l) =>
      l.key === next.key
        ? { ...l, quantity: roundClothWallQty(Math.min(maxQty, l.quantity + delta)) }
        : l,
    );
  }
  return [...lines, { ...next, quantity: roundClothWallQty(next.quantity ?? delta) }];
}

export function decrementClothWallQty(
  lines: ClothWallLine[],
  key: string,
  delta = 1,
): ClothWallLine[] {
  const existing = lines.find((l) => l.key === key);
  if (!existing) return lines;
  const nextQty = roundClothWallQty(existing.quantity - delta);
  if (nextQty < CLOTH_WALL_MIN_QTY) {
    return lines.filter((l) => l.key !== key);
  }
  return lines.map((l) => (l.key === key ? { ...l, quantity: nextQty } : l));
}

export function setClothWallQty(
  lines: ClothWallLine[],
  key: string,
  quantity: number,
): ClothWallLine[] {
  const qty = roundClothWallQty(quantity);
  if (qty < CLOTH_WALL_MIN_QTY) {
    return lines.filter((l) => l.key !== key);
  }
  return lines.map((l) => (l.key === key ? { ...l, quantity: qty } : l));
}

export function clothWallPieceCount(lines: ClothWallLine[]): number {
  return roundClothWallQty(lines.reduce((sum, l) => sum + l.quantity, 0));
}

export function clothWallSubtotalInr(lines: ClothWallLine[]): number {
  return roundClothWallQty(
    lines.reduce((sum, l) => sum + lineAmountInr(l.unitPriceInr, l.quantity), 0),
  );
}

/** Map Cloth Wall cart lines to walk-in order API payload items. */
export function buildWalkInItemsFromClothWallLines(
  lines: ClothWallLine[],
): WalkInOrderLineItem[] {
  return lines.map((line) => {
    if (line.garmentItemId && line.process) {
      return {
        garment_item_id: line.garmentItemId,
        process: line.process,
        quantity: line.quantity,
      };
    }
    if (line.catalogItemId && line.process) {
      return {
        catalog_item_id: line.catalogItemId,
        process: line.process,
        quantity: line.quantity,
      };
    }
    if (line.serviceId) {
      return {
        service_id: line.serviceId,
        quantity: line.quantity,
      };
    }
    throw new Error('Cloth wall line is missing a service source');
  });
}
