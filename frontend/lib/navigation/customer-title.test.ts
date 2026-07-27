import { getCustomerPageTitle } from '@/lib/navigation/customer-title';

describe('getCustomerPageTitle', () => {
  it('maps public auth and staff routes without falling back to DLM', () => {
    expect(getCustomerPageTitle('/login')).toBe('Sign in');
    expect(getCustomerPageTitle('/register')).toBe('Create account');
    expect(getCustomerPageTitle('/staff')).toBe('Staff portal');
  });

  it('uses WashHouse as the unknown-route fallback', () => {
    expect(getCustomerPageTitle('/unknown-route')).toBe('WashHouse');
  });
});
