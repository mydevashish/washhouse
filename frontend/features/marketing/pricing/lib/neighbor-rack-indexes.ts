/** Indexes to warm for a smooth crossfade: active ± 1 (in bounds). */
export function neighborRackIndexes(
  activeIndex: number,
  itemCount: number,
): number[] {
  if (itemCount <= 0) return [];
  const safe = Math.max(0, Math.min(activeIndex, itemCount - 1));
  const out: number[] = [];
  if (safe > 0) out.push(safe - 1);
  if (safe < itemCount - 1) out.push(safe + 1);
  return out;
}
