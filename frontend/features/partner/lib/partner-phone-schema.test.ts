import {
  canRunPartnerCustomerSearch,
  formatPhoneInputDisplay,
  getPartnerCustomerSearchError,
  getPartnerPhoneFieldError,
  isPartnerPhoneReady,
  isValidIndianMobileDigits,
  isValidIndianMobileE164,
  partnerPhoneDisplayValue,
  partnerPhoneFieldSchema,
  partnerPhoneToE164,
  PARTNER_PHONE_INLINE_ERROR,
} from '@/features/partner/lib/partner-phone-schema';

describe('partner-phone-schema', () => {
  describe('isValidIndianMobileDigits', () => {
    it('accepts exactly 10 digits starting 6–9', () => {
      expect(isValidIndianMobileDigits('9876543210')).toBe(true);
      expect(isValidIndianMobileDigits('6123456789')).toBe(true);
    });

    it('rejects 9 or 11 digits and invalid leading digit', () => {
      expect(isValidIndianMobileDigits('987654321')).toBe(false);
      expect(isValidIndianMobileDigits('98765432101')).toBe(false);
      expect(isValidIndianMobileDigits('5876543210')).toBe(false);
    });
  });

  describe('formatPhoneInputDisplay', () => {
    it('strips non-digits and caps at 10', () => {
      expect(formatPhoneInputDisplay('+91 98765 43210')).toBe('9876543210');
      expect(formatPhoneInputDisplay('987654321012345')).toBe('9876543210');
    });
  });

  describe('partnerPhoneToE164', () => {
    it('stores +91XXXXXXXXXX for valid input', () => {
      expect(partnerPhoneToE164('9876543210')).toBe('+919876543210');
      expect(partnerPhoneToE164('+919876543210')).toBe('+919876543210');
    });

    it('does not produce E.164 for 9-digit partial', () => {
      expect(isValidIndianMobileE164(partnerPhoneToE164('987654321'))).toBe(false);
    });
  });

  describe('partnerPhoneFieldSchema', () => {
    it('parses valid 10-digit mobile to E.164', () => {
      const result = partnerPhoneFieldSchema.safeParse('9876543210');
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe('+919876543210');
    });

    it('rejects 9 and 11 digit numbers', () => {
      expect(partnerPhoneFieldSchema.safeParse('987654321').success).toBe(false);
      expect(partnerPhoneFieldSchema.safeParse('98765432101').success).toBe(false);
    });

    it('uses spec inline error message', () => {
      const result = partnerPhoneFieldSchema.safeParse('1234567890');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(PARTNER_PHONE_INLINE_ERROR);
      }
    });
  });

  describe('getPartnerPhoneFieldError', () => {
    it('returns error when 10 digits are invalid', () => {
      expect(getPartnerPhoneFieldError('1234567890')).toBe(PARTNER_PHONE_INLINE_ERROR);
    });

    it('returns null while typing fewer than 10 digits', () => {
      expect(getPartnerPhoneFieldError('987654321')).toBeNull();
    });

    it('requires complete phone when requireComplete is set', () => {
      expect(getPartnerPhoneFieldError('987654321', { requireComplete: true })).toBe(
        PARTNER_PHONE_INLINE_ERROR,
      );
    });
  });

  describe('isPartnerPhoneReady', () => {
    it('is true only for valid mobiles', () => {
      expect(isPartnerPhoneReady('9876543210')).toBe(true);
      expect(isPartnerPhoneReady('987654321')).toBe(false);
    });
  });

  describe('partnerPhoneDisplayValue', () => {
    it('shows 10 digits from E.164 storage', () => {
      expect(partnerPhoneDisplayValue('+919876543210')).toBe('9876543210');
    });
  });

  describe('canRunPartnerCustomerSearch', () => {
    it('allows empty, name ≥2 chars, or valid phone', () => {
      expect(canRunPartnerCustomerSearch('')).toBe(true);
      expect(canRunPartnerCustomerSearch('Priya')).toBe(true);
      expect(canRunPartnerCustomerSearch('9876543210')).toBe(true);
      expect(canRunPartnerCustomerSearch('+919876543210')).toBe(true);
    });

    it('blocks partial or invalid phone and short names', () => {
      expect(canRunPartnerCustomerSearch('987654321')).toBe(false);
      expect(canRunPartnerCustomerSearch('98765432101')).toBe(false);
      expect(canRunPartnerCustomerSearch('P')).toBe(false);
    });
  });

  describe('getPartnerCustomerSearchError', () => {
    it('surfaces phone error for invalid 10-digit runs', () => {
      expect(getPartnerCustomerSearchError('1234567890')).toBe(PARTNER_PHONE_INLINE_ERROR);
    });

    it('does not error while typing fewer than 10 phone digits', () => {
      expect(getPartnerCustomerSearchError('987654321')).toBeNull();
    });
  });
});
