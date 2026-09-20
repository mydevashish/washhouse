process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:8000/api/v1';
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { BookPickupForm } from '@/features/marketing/book-now/book-pickup-form';
import { submitMarketingBookNow } from '@/lib/api/marketing';

jest.mock('@/lib/api/marketing', () => ({
  submitMarketingBookNow: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockSubmit = submitMarketingBookNow as jest.MockedFunction<typeof submitMarketingBookNow>;

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

  it('POSTs book-now fields and shows confirmation', async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue({
      success: true,
      message: 'Your request has been submitted successfully.',
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
        name: 'Priya Sharma',
        phone: '+919876543210',
        service: 'wash-fold',
        preferred_time: 'morning',
        message: 'Near metro',
      }),
    );

    expect(await screen.findByTestId('book-pickup-success')).toBeInTheDocument();
    expect(screen.getByTestId('book-pickup-public-code')).toBeInTheDocument();
    expect(screen.getByText(/what happens next/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /whatsapp us/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call us/i })).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^done$/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
