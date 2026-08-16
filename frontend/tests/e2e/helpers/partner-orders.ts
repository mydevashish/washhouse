import type { APIRequestContext, Page } from '@playwright/test';

import { E2E_ACCOUNTS } from './auth';

const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

type LoginData = {
  data: {
    tokens: { access_token: string };
  };
};

async function loginToken(
  request: APIRequestContext | Page['request'],
  email: string,
  password: string,
): Promise<string> {
  const loginRes = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  if (!loginRes.ok()) {
    throw new Error(`Login failed for ${email}: ${loginRes.status()} ${await loginRes.text()}`);
  }
  const loginJson = (await loginRes.json()) as LoginData;
  return loginJson.data.tokens.access_token;
}

/**
 * Resolve the seed partner's laundry id + a bookable service (avoids stale hardcoded UUIDs).
 */
async function resolvePartnerLaundry(
  request: APIRequestContext | Page['request'],
): Promise<{ laundryId: string; serviceId: string }> {
  if (process.env.E2E_PARTNER_LAUNDRY_ID) {
    const token = await loginToken(
      request,
      E2E_ACCOUNTS.customer.email,
      E2E_ACCOUNTS.customer.password,
    );
    const headers = { Authorization: `Bearer ${token}` };
    const laundryRes = await request.get(
      `${API_BASE}/laundries/${process.env.E2E_PARTNER_LAUNDRY_ID}`,
      { headers },
    );
    if (!laundryRes.ok()) {
      throw new Error(`Laundry detail failed: ${laundryRes.status()}`);
    }
    const laundryJson = (await laundryRes.json()) as {
      data: { id: string; services: Array<{ id: string }> };
    };
    const serviceId = laundryJson.data.services[0]?.id;
    if (!serviceId) throw new Error('Env laundry has no services');
    return { laundryId: laundryJson.data.id, serviceId };
  }

  const partnerToken = await loginToken(
    request,
    E2E_ACCOUNTS.partner.email,
    E2E_ACCOUNTS.partner.password,
  );
  const summary = await request.get(`${API_BASE}/partner/analytics/summary`, {
    headers: { Authorization: `Bearer ${partnerToken}` },
  });
  if (!summary.ok()) {
    throw new Error(`Partner summary failed: ${summary.status()} ${await summary.text()}`);
  }
  const summaryJson = (await summary.json()) as {
    data: { laundry_id: string | null; laundry_name: string };
  };
  const laundryId = summaryJson.data.laundry_id;
  if (!laundryId) throw new Error('Partner has no laundry — run seed_qa');

  const customerToken = await loginToken(
    request,
    E2E_ACCOUNTS.customer.email,
    E2E_ACCOUNTS.customer.password,
  );
  const laundryRes = await request.get(`${API_BASE}/laundries/${laundryId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (!laundryRes.ok()) {
    throw new Error(`Laundry detail failed: ${laundryRes.status()}`);
  }
  const laundryJson = (await laundryRes.json()) as {
    data: { services: Array<{ id: string }> };
  };
  const serviceId = laundryJson.data.services[0]?.id;
  if (!serviceId) throw new Error(`Laundry ${laundryId} has no services`);
  return { laundryId, serviceId };
}

/**
 * Create a confirmed online order for the partner laundry so Accept UI is exerciseable.
 * Uses customer seed credentials via API (not UI).
 */
export async function seedPartnerIncomingOrder(
  request: APIRequestContext | Page['request'],
): Promise<{ orderId: string; trackingCode: string }> {
  const { laundryId, serviceId } = await resolvePartnerLaundry(request);
  const token = await loginToken(
    request,
    E2E_ACCOUNTS.customer.email,
    E2E_ACCOUNTS.customer.password,
  );
  const headers = { Authorization: `Bearer ${token}` };

  const addrRes = await request.get(`${API_BASE}/users/me/addresses`, { headers });
  if (!addrRes.ok()) {
    throw new Error(`Addresses failed: ${addrRes.status()}`);
  }
  const addrJson = (await addrRes.json()) as { data: Array<{ id: string }> };
  const addressId = addrJson.data[0]?.id;
  if (!addressId) throw new Error('Customer has no address — run seed_qa');

  const pickup = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const delivery = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const createRes = await request.post(`${API_BASE}/orders`, {
    headers,
    data: {
      laundry_id: laundryId,
      address_id: addressId,
      pickup_at: pickup,
      delivery_at: delivery,
      items: [{ service_id: serviceId, quantity: 1 }],
      notes: `E2E partner accept ${Date.now().toString(36)}`,
    },
  });
  if (!createRes.ok()) {
    throw new Error(`Create order failed: ${createRes.status()} ${await createRes.text()}`);
  }
  const orderJson = (await createRes.json()) as {
    data: { id: string; tracking_code: string };
  };
  return { orderId: orderJson.data.id, trackingCode: orderJson.data.tracking_code };
}

/**
 * Accept order and prepare pickup_assigned with evidence + inventory for picked_up.
 */
export async function seedPartnerPickupReadyOrder(
  request: APIRequestContext | Page['request'],
): Promise<{ orderId: string; trackingCode: string }> {
  const { orderId, trackingCode } = await seedPartnerIncomingOrder(request);
  const partnerToken = await loginToken(
    request,
    E2E_ACCOUNTS.partner.email,
    E2E_ACCOUNTS.partner.password,
  );
  const headers = { Authorization: `Bearer ${partnerToken}` };

  const accept = await request.post(`${API_BASE}/partner/orders/${orderId}/accept`, { headers });
  if (!accept.ok()) {
    throw new Error(`Accept failed: ${accept.status()} ${await accept.text()}`);
  }

  const jpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
    'base64',
  );
  const evidence = await request.post(`${API_BASE}/partner/orders/${orderId}/pickup-evidence`, {
    headers,
    multipart: {
      files: {
        name: 'pickup.jpg',
        mimeType: 'image/jpeg',
        buffer: jpeg,
      },
    },
  });
  if (!evidence.ok()) {
    throw new Error(`Pickup evidence failed: ${evidence.status()} ${await evidence.text()}`);
  }

  const inventory = await request.put(
    `${API_BASE}/partner/orders/${orderId}/inventory-verification`,
    {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: {
        items: {
          shirts: 2,
          trousers: 0,
          sarees: 0,
          jackets: 0,
          bedsheets: 0,
          blankets: 0,
          curtains: 0,
          other: 0,
        },
      },
    },
  );
  if (!inventory.ok()) {
    throw new Error(`Inventory failed: ${inventory.status()} ${await inventory.text()}`);
  }

  return { orderId, trackingCode };
}

