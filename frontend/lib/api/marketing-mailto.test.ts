process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:8000/api/v1';
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';

import {
  submitMarketingBookNow,
  submitMarketingContact,
  submitMarketingFranchiseInquiry,
} from '@/lib/api/marketing';

describe('marketing submission API', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('posts contact form data to the server API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: '123e4567-e89b-12d3-a456-426614174000', status: 'received' },
      }),
    });

    await submitMarketingContact({
      name: 'Jane Doe',
      phone: '+919876543210',
      email: 'jane@example.com',
      subject: 'general',
      message: 'I want to know more about your service.',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/marketing/contact',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('posts franchise inquiry data to the server API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: '123e4567-e89b-12d3-a456-426614174001', status: 'received' },
      }),
    });

    await submitMarketingFranchiseInquiry({
      name: 'Jane Doe',
      phone: '+919876543210',
      email: 'jane@example.com',
      city: 'Bengaluru',
      investment_range: '25-50',
      message: 'I am looking to open a washhouse in Bengaluru.',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/marketing/franchise-inquiries',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('posts Book Now data to the marketing mail API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: '123e4567-e89b-12d3-a456-426614174002', status: 'received' },
      }),
    });

    await submitMarketingBookNow({
      name: 'Jane Doe',
      phone: '+919876543210',
      service: 'wash-fold',
      preferred_time: 'morning',
      message: 'Please call me to confirm the pickup details.',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/marketing/book-now',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
});
