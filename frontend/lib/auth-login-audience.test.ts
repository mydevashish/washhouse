import {
  getLoginAudienceCopy,
  getLoginPageTitle,
  parseLoginAudience,
} from '@/lib/auth-login-audience';

describe('auth login audience', () => {
  it('parses partner and admin; defaults to partner', () => {
    expect(parseLoginAudience('partner')).toBe('partner');
    expect(parseLoginAudience('admin')).toBe('admin');
    expect(parseLoginAudience(null)).toBe('partner');
    expect(parseLoginAudience('other')).toBe('partner');
  });

  it('exposes audience-aware document titles (not DLM)', () => {
    expect(getLoginPageTitle('partner')).toBe('Laundry login');
    expect(getLoginPageTitle('admin')).toBe('Admin login');
  });

  it('keeps card titles distinct from compact document titles for staff', () => {
    expect(getLoginAudienceCopy('partner').title).toBe('Laundry partner sign in');
    expect(getLoginAudienceCopy('admin').title).toBe('Admin sign in');
    expect(getLoginAudienceCopy('partner').backHref).toBe('/staff');
    expect(getLoginAudienceCopy('admin').backHref).toBe('/staff');
  });
});
