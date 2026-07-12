export interface Laundry {
  id: string;
  name: string;
  slug: string;
  city: string;
  rating_avg: number;
  rating_count: number;
  is_approved: boolean;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}
