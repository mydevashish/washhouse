import {
  groupServicesByCategory,
  type ServiceCategoryGroup,
} from '@/features/discover/detail/lib/group-services-by-category';
import { normalizeServiceCategory } from '@/features/discover/detail/lib/normalize-service-category';
import type { LaundryServiceItem } from '@/services/laundries';

function svc(
  partial: Partial<LaundryServiceItem> & Pick<LaundryServiceItem, 'id' | 'name' | 'category'>,
): LaundryServiceItem {
  return {
    unit: 'kg',
    price_inr: '99',
    is_active: true,
    ...partial,
  };
}

describe('groupServicesByCategory', () => {
  it('groups by canonical category and prefers known order', () => {
    const groups = groupServicesByCategory([
      svc({ id: '1', name: 'Steam Press', category: 'iron' }),
      svc({ id: '2', name: 'Wash & Fold', category: 'wash' }),
      svc({ id: '3', name: 'Dry Clean', category: 'dry_clean' }),
    ]);

    expect(groups.map((g: ServiceCategoryGroup) => g.category)).toEqual([
      'wash',
      'iron',
      'dry-clean',
    ]);
    expect(groups[0]?.label).toBe('Wash & Fold');
    expect(groups[2]?.label).toBe('Dry Clean');
  });

  it('skips inactive services', () => {
    const groups = groupServicesByCategory([
      svc({ id: '1', name: 'Wash', category: 'wash', is_active: false }),
      svc({ id: '2', name: 'Iron', category: 'iron' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.category).toBe('iron');
  });

  it('appends unknown categories after known order', () => {
    const groups = groupServicesByCategory([
      svc({ id: '1', name: 'Custom', category: 'vip' }),
      svc({ id: '2', name: 'Wash', category: 'wash' }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(['wash', 'vip']);
  });
});

describe('normalizeServiceCategory', () => {
  it('normalizes underscores to hyphens', () => {
    expect(normalizeServiceCategory('dry_clean')).toBe('dry-clean');
    expect(normalizeServiceCategory('Dry_Clean')).toBe('dry-clean');
  });
});
