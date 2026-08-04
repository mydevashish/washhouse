import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CustomerDeskSearch } from '@/features/admin/customer-desk/components/customer-desk-search';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/admin/customer-desk/phone';
import { assistedOrderFormSchema, phoneSearchSchema } from '@/features/admin/customer-desk/schemas';

describe('Customer Desk phone helpers', () => {
  it('normalizes 10-digit Indian mobiles to +91 E.164', () => {
    expect(normalizeIndianPhoneInput('9876543210')).toBe('+919876543210');
    expect(normalizeIndianPhoneInput('91 98765 43210')).toBe('+919876543210');
    expect(isValidIndianMobileE164('+919876543210')).toBe(true);
    expect(isValidIndianMobileE164('+911234567890')).toBe(false);
  });

  it('rejects invalid search phones via schema', () => {
    expect(phoneSearchSchema.safeParse('123').success).toBe(false);
    expect(phoneSearchSchema.safeParse('9876543210').success).toBe(true);
  });
});

describe('CustomerDeskSearch', () => {
  it('rejects queries shorter than 2 characters', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<CustomerDeskSearch onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText(/priya sharma/i), 'a');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 2 characters/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an exact E.164 phone', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<CustomerDeskSearch onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText(/priya sharma/i), '9876543210');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ kind: 'phone', phone: '+919876543210' }),
    );
  });

  it('submits a name query for server search', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<CustomerDeskSearch onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText(/priya sharma/i), 'Priya');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ kind: 'query', q: 'Priya' }));
  });
});

describe('assistedOrderFormSchema', () => {
  const base = {
    customer_name: 'Priya',
    phone: '9876543210',
    laundry_id: '11111111-1111-4111-8111-111111111111',
    address_line1: '12 MG Road',
    address_line2: '',
    address_city: 'Bengaluru',
    address_pincode: '560001',
    address_landmark: '',
    pickup_at: '2026-08-05T10:00',
    delivery_at: '2026-08-06T18:00',
    notes: '',
    items: [{ service_id: '22222222-2222-4222-8222-222222222222', quantity: 1 }],
  };

  it('accepts a complete assisted order payload', () => {
    const parsed = assistedOrderFormSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBe('+919876543210');
    }
  });

  it('requires address, pincode, laundry, and at least one item', () => {
    expect(
      assistedOrderFormSchema.safeParse({
        ...base,
        address_line1: '',
        address_pincode: '56',
        laundry_id: '',
        items: [],
      }).success,
    ).toBe(false);
  });

  it('rejects delivery before pickup', () => {
    const parsed = assistedOrderFormSchema.safeParse({
      ...base,
      pickup_at: '2026-08-06T18:00',
      delivery_at: '2026-08-05T10:00',
    });
    expect(parsed.success).toBe(false);
  });
});
