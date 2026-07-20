export type MarketingTestimonial = {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  /** Omitted in static fallback — `TestimonialAvatar` renders name initials instead. */
  avatarUrl?: string;
  isFeatured: boolean;
};
