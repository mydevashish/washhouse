import { PARTNER_PRACTICE_MODE_STORAGE_KEY } from '@/features/partner-shop-floor/types';
import { usePartnerPracticeModeStore } from '@/features/partner-shop-floor/store/partner-practice-mode.store';

describe('partner practice mode preference', () => {
  beforeEach(() => {
    usePartnerPracticeModeStore.setState({ enabled: false });
  });

  it('defaults to off', () => {
    expect(usePartnerPracticeModeStore.getState().enabled).toBe(false);
    expect(PARTNER_PRACTICE_MODE_STORAGE_KEY).toBe('dlm.partner_practice_mode');
  });

  it('setEnabled and toggle flip the flag', () => {
    const { setEnabled, toggle } = usePartnerPracticeModeStore.getState();
    setEnabled(true);
    expect(usePartnerPracticeModeStore.getState().enabled).toBe(true);
    toggle();
    expect(usePartnerPracticeModeStore.getState().enabled).toBe(false);
  });
});
