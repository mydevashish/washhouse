import { MARKETING_TESTIMONIALS_FALLBACK } from '@/features/marketing/testimonials/testimonials-fallback';

describe('MARKETING_TESTIMONIALS_FALLBACK', () => {
  it('does not reference Unsplash stock photos', () => {
    for (const testimonial of MARKETING_TESTIMONIALS_FALLBACK) {
      expect(JSON.stringify(testimonial)).not.toMatch(/unsplash/i);
    }
  });

  it('omits avatarUrl so TestimonialAvatar renders initials', () => {
    for (const testimonial of MARKETING_TESTIMONIALS_FALLBACK) {
      expect(testimonial.avatarUrl).toBeUndefined();
    }
  });
});
