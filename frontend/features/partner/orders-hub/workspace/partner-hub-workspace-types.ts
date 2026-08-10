/** Four-pillar workspace ids synced to `?workspace=` on `/partner/orders`. */

export const PARTNER_HUB_WORKSPACE_IDS = [
  'customers',
  'orders',
  'coupons',
  'services',
] as const;

export type PartnerHubWorkspaceId = (typeof PARTNER_HUB_WORKSPACE_IDS)[number];

export function parsePartnerHubWorkspace(
  value: string | null | undefined,
): PartnerHubWorkspaceId | null {
  if (
    value === 'customers' ||
    value === 'orders' ||
    value === 'coupons' ||
    value === 'services'
  ) {
    return value;
  }
  return null;
}

export function isPartnerHubWorkspaceId(value: string): value is PartnerHubWorkspaceId {
  return (PARTNER_HUB_WORKSPACE_IDS as readonly string[]).includes(value);
}
