import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { BookPickupForm } from '@/features/marketing/book-now/book-pickup-form';
import { submitBookingRequest } from '@/lib/api/booking-requests';

jest.mock('@/lib/api/booking-requests', () => ({
  submitBookingRequest: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockSubmit = submitBookingRequest as jest.MockedFunction<typeof submitBookingRequest>;

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('BookPickupForm submit mapping', () => {
  beforeEach(() => {
    mockSubmit.mockReset();
  });

  it('POSTs mapped booking-request fields and shows public_code confirmation', async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue({
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        public_code: 'BR-K7M2QX',
        status: 'new',
      },
      meta: { duplicate_warning: false, open_request_ids: [] },
    });

    const onDone = jest.fn();
    render(wrap(<BookPickupForm idPrefix="test-book" onDone={onDone} />));

    await user.type(screen.getByLabelText(/your name/i), 'Priya Sharma');
    await user.type(screen.getByLabelText(/^phone/i), '+919876543210');
    await user.selectOptions(screen.getByLabelText(/^service/i), 'wash-fold');
    await user.selectOptions(screen.getByLabelText(/preferred pickup time/i), 'morning');
    await user.type(screen.getByLabelText(/notes/i), 'Near metro');

    await user.click(screen.getByRole('button', { name: /schedule pickup/i }));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customer_name: 'Priya Sharma',
        phone: '+919876543210',
        service_type: 'wash-fold',
        preferred_time_window: 'morning',
        notes: 'Near metro',
        source: expect.stringMatching(/^(marketing_home|deep_link|stores|services)$/),
      }),
    );

    expect(await screen.findByTestId('book-pickup-success')).toBeInTheDocument();
    expect(screen.getByTestId('book-pickup-public-code')).toHaveTextContent('BR-K7M2QX');
    expect(screen.getByText(/what happens next/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /whatsapp us/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call us/i })).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^done$/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
