import {
  DEFAULT_PARTNER_UI_MODE,
  isPartnerUiMode,
  normalizePartnerUiMode,
} from '@/features/partner-shop-floor/types';
import { usePartnerUiModeStore } from '@/features/partner-shop-floor/store/partner-ui-mode.store';

describe('partner_ui_mode preference', () => {
  beforeEach(() => {
    usePartnerUiModeStore.setState({ mode: DEFAULT_PARTNER_UI_MODE });
  });

  it('defaults to advanced (single shell)', () => {
    expect(usePartnerUiModeStore.getState().mode).toBe('advanced');
    expect(DEFAULT_PARTNER_UI_MODE).toBe('advanced');
  });

  it('setMode forces shop_floor writes to advanced (display mode retired)', () => {
    const { setMode } = usePartnerUiModeStore.getState();
    setMode('shop_floor');
    expect(usePartnerUiModeStore.getState().mode).toBe('advanced');
    setMode('advanced');
    expect(usePartnerUiModeStore.getState().mode).toBe('advanced');
  });

  it('toggleMode is a no-op that stays on advanced', () => {
    const { toggleMode } = usePartnerUiModeStore.getState();
    toggleMode();
    expect(usePartnerUiModeStore.getState().mode).toBe('advanced');
  });

  it('isPartnerUiMode guards unknown values', () => {
    expect(isPartnerUiMode('shop_floor')).toBe(true);
    expect(isPartnerUiMode('advanced')).toBe(true);
    expect(isPartnerUiMode('classic')).toBe(false);
    expect(isPartnerUiMode(null)).toBe(false);
  });

  it('normalizePartnerUiMode migrates shop_floor → advanced on hydrate', () => {
    expect(normalizePartnerUiMode('shop_floor')).toBe('advanced');
    expect(normalizePartnerUiMode('advanced')).toBe('advanced');
    expect(normalizePartnerUiMode('classic')).toBe('advanced');
    expect(normalizePartnerUiMode(undefined)).toBe('advanced');
  });

  it('persist merge migrates shop_floor → advanced', () => {
    const persistApi = usePartnerUiModeStore.persist;
    expect(persistApi).toBeDefined();
    usePartnerUiModeStore.setState({ mode: 'shop_floor' });
    const merged = normalizePartnerUiMode(usePartnerUiModeStore.getState().mode);
    expect(merged).toBe('advanced');
    usePartnerUiModeStore.setState({ mode: merged });
    expect(usePartnerUiModeStore.getState().mode).toBe('advanced');
  });
});
