import {
  DEFAULT_PARTNER_UI_MODE,
  isPartnerUiMode,
} from '@/features/partner-shop-floor/types';
import { usePartnerUiModeStore } from '@/features/partner-shop-floor/store/partner-ui-mode.store';

describe('partner_ui_mode preference', () => {
  beforeEach(() => {
    usePartnerUiModeStore.setState({ mode: DEFAULT_PARTNER_UI_MODE });
  });

  it('defaults to shop_floor', () => {
    expect(usePartnerUiModeStore.getState().mode).toBe('shop_floor');
    expect(DEFAULT_PARTNER_UI_MODE).toBe('shop_floor');
  });

  it('setMode switches to advanced and back', () => {
    const { setMode } = usePartnerUiModeStore.getState();
    setMode('advanced');
    expect(usePartnerUiModeStore.getState().mode).toBe('advanced');
    setMode('shop_floor');
    expect(usePartnerUiModeStore.getState().mode).toBe('shop_floor');
  });

  it('toggleMode flips between shop_floor and advanced', () => {
    const { toggleMode } = usePartnerUiModeStore.getState();
    toggleMode();
    expect(usePartnerUiModeStore.getState().mode).toBe('advanced');
    toggleMode();
    expect(usePartnerUiModeStore.getState().mode).toBe('shop_floor');
  });

  it('isPartnerUiMode guards unknown values', () => {
    expect(isPartnerUiMode('shop_floor')).toBe(true);
    expect(isPartnerUiMode('advanced')).toBe(true);
    expect(isPartnerUiMode('classic')).toBe(false);
    expect(isPartnerUiMode(null)).toBe(false);
  });
});
