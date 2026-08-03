import {
  mapBookPickupToBookingRequest,
  resolveBookingRequestSource,
} from '@/features/marketing/book-now/map-book-pickup-to-request';

describe('mapBookPickupToBookingRequest', () => {
  it('maps form fields to POST /booking-requests body', () => {
    expect(
      mapBookPickupToBookingRequest(
        {
          name: '  Priya Sharma  ',
          phone: '+919876543210',
          service: 'wash-fold',
          preferredTime: 'morning',
          message: '  Near metro, ~8 kg  ',
        },
        'marketing_home',
      ),
    ).toEqual({
      customer_name: 'Priya Sharma',
      phone: '+919876543210',
      service_type: 'wash-fold',
      preferred_time_window: 'morning',
      notes: 'Near metro, ~8 kg',
      source: 'marketing_home',
    });
  });

  it('omits notes when message is empty or whitespace', () => {
    expect(
      mapBookPickupToBookingRequest(
        {
          name: 'Dev',
          phone: '9876543210',
          service: 'dry-clean',
          preferredTime: 'flexible',
          message: '   ',
        },
        'stores',
      ),
    ).toEqual({
      customer_name: 'Dev',
      phone: '9876543210',
      service_type: 'dry-clean',
      preferred_time_window: 'flexible',
      source: 'stores',
    });
  });

  it('defaults source to marketing_home', () => {
    const body = mapBookPickupToBookingRequest({
      name: 'Asha',
      phone: '+919811122233',
      service: 'shoe-cleaning',
      preferredTime: 'evening',
    });
    expect(body.source).toBe('marketing_home');
    expect(body.notes).toBeUndefined();
  });
});

describe('resolveBookingRequestSource', () => {
  it('returns deep_link when ?book=1 is present', () => {
    expect(resolveBookingRequestSource('/', '?book=1')).toBe('deep_link');
    expect(resolveBookingRequestSource('/services', 'book=1')).toBe('deep_link');
  });

  it('returns stores / services from pathname', () => {
    expect(resolveBookingRequestSource('/stores', '')).toBe('stores');
    expect(resolveBookingRequestSource('/services', '')).toBe('services');
  });

  it('returns marketing_home for home and other paths', () => {
    expect(resolveBookingRequestSource('/', '')).toBe('marketing_home');
    expect(resolveBookingRequestSource('/pricing', '')).toBe('marketing_home');
    expect(resolveBookingRequestSource('/franchise', '')).toBe('marketing_home');
  });
});
