import { isLocalBackendHost, shouldSkipRemoteBackendFetch } from '@/lib/remote-backend';

describe('shouldSkipRemoteBackendFetch', () => {
  const originalPhase = process.env.NEXT_PHASE;

  afterEach(() => {
    if (originalPhase === undefined) {
      delete process.env.NEXT_PHASE;
    } else {
      process.env.NEXT_PHASE = originalPhase;
    }
  });

  it('skips localhost and loopback hosts', () => {
    expect(isLocalBackendHost('http://localhost:8000/api/v1')).toBe(true);
    expect(isLocalBackendHost('http://127.0.0.1:8000/api/v1')).toBe(true);
    expect(shouldSkipRemoteBackendFetch('http://localhost:8000/api/v1')).toBe(true);
  });

  it('skips during next production build even for remote URLs', () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    expect(shouldSkipRemoteBackendFetch('https://api.example.com/api/v1')).toBe(true);
  });

  it('allows a public API URL outside of production build', () => {
    delete process.env.NEXT_PHASE;
    expect(isLocalBackendHost('https://api.example.com/api/v1')).toBe(false);
    expect(shouldSkipRemoteBackendFetch('https://api.example.com/api/v1')).toBe(false);
  });
});
