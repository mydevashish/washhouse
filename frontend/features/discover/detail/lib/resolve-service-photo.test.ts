import { resolveServicePhoto } from '@/features/discover/detail/lib/resolve-service-photo';

describe('resolveServicePhoto', () => {
  it('falls back to wash category hero for unknown wash services', () => {
    const photo = resolveServicePhoto('Custom Bulk Laundry Pack', 'wash');
    expect(photo.src).toContain('wash-fold');
  });

  it('uses steam ironing hero for iron category', () => {
    const photo = resolveServicePhoto('Custom Press Service', 'iron');
    expect(photo.src).toContain('steam-ironing');
  });

  it('normalizes dry_clean to dry-clean hero', () => {
    const photo = resolveServicePhoto('Mystery Garment Care', 'dry_clean');
    expect(photo.src).toContain('shirt');
  });
});
