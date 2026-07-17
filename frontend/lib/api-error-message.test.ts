import axios from 'axios';

import { getMarketingSubmitErrorMessage } from '@/features/marketing/lib/marketing-form-errors';
import { getApiErrorMessage } from '@/lib/api-error-message';

jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}));

describe('getApiErrorMessage', () => {
  it('does not leak bare Network Error when API is unreachable', () => {
    const err = new axios.AxiosError('Network Error');
    err.response = undefined;

    const message = getApiErrorMessage(err, 'fallback');

    expect(message).toContain('Cannot reach API at http://localhost:8000/api/v1');
    expect(message).not.toBe('Network Error');
  });

  it('prefers API envelope message', () => {
    const err = new axios.AxiosError('Request failed');
    err.response = {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: { headers: {} } as never,
      data: {
        error: { code: 'RATE_LIMITED', message: 'Too many contact requests for this phone number.' },
      },
    };

    expect(getApiErrorMessage(err)).toBe('Too many contact requests for this phone number.');
  });
});

describe('getMarketingSubmitErrorMessage', () => {
  it('shows actionable unavailable copy for network failures', () => {
    const err = new axios.AxiosError('Network Error');
    err.response = undefined;

    const message = getMarketingSubmitErrorMessage(err, 'fallback');

    expect(message).toMatch(/couldn.?t reach our servers/i);
    expect(message).toMatch(/email/i);
    expect(message).not.toBe('Network Error');
  });
});
