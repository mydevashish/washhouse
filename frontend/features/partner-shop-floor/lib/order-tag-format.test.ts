import {
  getServiceShortCode,
  normalizeTagServiceLabel,
  getTagCountLabel,
} from './order-tag-format';
import { garmentDisplayLabel } from './garment-labels';

describe('partner shop floor tag formatting', () => {
  it('strips kg and maps common services to short codes', () => {
    expect(getServiceShortCode('Wash & Fold / kg')).toBe('WF');
    expect(getServiceShortCode('Wash & Iron / kg')).toBe('WI');
    expect(getServiceShortCode('Dry Clean / kg')).toBe('DC');
    expect(getServiceShortCode('Press / kg')).toBe('P');
  });

  it('normalizes text inputs without kg noise', () => {
    expect(normalizeTagServiceLabel('Wash & Fold / kg')).toBe('Wash & Fold');
    expect(normalizeTagServiceLabel('Dry Clean · GC-12')).toBe('Dry Clean');
  });

  it('removes kg from catalog label data used in UI', () => {
    expect(garmentDisplayLabel('kg-wash-fold', 'Wash & Fold').english).toBe('Wash & Fold');
  });

  it('builds compact count labels for per-piece printing', () => {
    expect(getTagCountLabel({ piece_index: 1, piece_total: 5 })).toBe('1/5');
    expect(getTagCountLabel({ piece_index: 2, piece_total: 2 })).toBe('2/2');
    expect(getTagCountLabel({ qty_index: '×3' })).toBe('×3');
  });
});
