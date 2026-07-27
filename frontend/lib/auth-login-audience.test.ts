import {
  getLoginAudienceCopy,
  getLoginPageTitle,
  parseLoginAudience,
} from '@/lib/auth-login-audience';

describe('auth login audience', () => {
  it('parses partner and admin; defaults to customer', () => {
    expect(parseLoginAudience('partner')).toBe('partner');
    expect(parseLoginAudience('admin')).toBe('admin');
    expect(parseLoginAudience(null)).toBe('customer');
    expect(parseLoginAudience('other')).toBe('customer');
  });

  it('exposes audience-aware navbar titles (not DLM)', () => {
    expect(getLoginPageTitle('customer')).toBe('Sign in');
    expect(getLoginPageTitle('partner')).toBe('Laundry login');
    expect(getLoginPageTitle('admin')).toBe('Admin login');
  });

  it('keeps card titles distinct from compact navbar titles for staff', () => {
    expect(getLoginAudienceCopy('partner').title).toBe('Laundry partner sign in');
    expect(getLoginAudienceCopy('admin').title).toBe('Admin sign in');
    expect(getLoginAudienceCopy('partner').backHref).toBe('/staff');
    expect(getLoginAudienceCopy('admin').backHref).toBe('/staff');
  });
});
