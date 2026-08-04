/** Orders Hub deep-links and legacy redirect helpers (Admin + Partner). */

export const ORDERS_HUB_TABS = ['orders', 'desk', 'requests', 'directory'] as const;

export type OrdersHubTab = (typeof ORDERS_HUB_TABS)[number];

export type OrdersHubBasePath = '/admin/orders' | '/partner/orders';

export const ORDERS_HUB_TAB_LABELS: Record<OrdersHubTab, string> = {
  orders: 'Today / Orders',
  desk: 'Find customer',
  requests: 'Requests',
  directory: 'Directory',
};

export function parseOrdersHubTab(value: string | null | undefined): OrdersHubTab {
  if (value === 'desk' || value === 'requests' || value === 'directory' || value === 'orders') {
    return value;
  }
  return 'orders';
}

export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

function appendSearchParam(params: URLSearchParams, key: string, value: string) {
  if (key === 'tab') return;
  params.append(key, value);
}

/** Copy query extras (phone, user_id, status, …) while applying the hub `tab`. */
export function buildOrdersHubSearchParams(
  tab: OrdersHubTab,
  incoming?: SearchParamsInput,
): URLSearchParams {
  const params = new URLSearchParams();

  if (incoming instanceof URLSearchParams) {
    incoming.forEach((value, key) => appendSearchParam(params, key, value));
  } else if (incoming) {
    for (const [key, value] of Object.entries(incoming)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) appendSearchParam(params, key, item);
      } else {
        appendSearchParam(params, key, value);
      }
    }
  }

  if (tab === 'orders') {
    params.delete('tab');
  } else {
    params.set('tab', tab);
  }

  return params;
}

export function buildOrdersHubPath(
  basePath: OrdersHubBasePath,
  tab: OrdersHubTab,
  incoming?: SearchParamsInput,
): string {
  const qs = buildOrdersHubSearchParams(tab, incoming).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
