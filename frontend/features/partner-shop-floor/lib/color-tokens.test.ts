import {
  COLOR_TOKEN_PATTERNS,
  COLOR_TOKENS,
  colorTokenPatternCss,
  isColorTokenKey,
} from '@/features/partner-shop-floor/lib/color-tokens';

describe('color token patterns', () => {
  it('assigns a pattern for every palette color', () => {
    for (const key of COLOR_TOKENS) {
      expect(COLOR_TOKEN_PATTERNS[key]).toBeTruthy();
      expect(colorTokenPatternCss(COLOR_TOKEN_PATTERNS[key])).not.toBe('none');
    }
  });

  it('keeps letter map and key guard', () => {
    expect(isColorTokenKey('red')).toBe(true);
    expect(isColorTokenKey('maroon')).toBe(false);
  });
});
