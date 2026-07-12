import { Star } from 'lucide-react';

import { ClientDate } from '@/components/ui/client-date';
import { ClientLocaleNumber } from '@/components/ui/client-locale-number';
import { Card, CardContent } from '@/components/ui/card';
import type { Review } from '@/services/laundries';

type LaundryReviewsTabProps = {
  reviews: Review[] | undefined;
  isLoading: boolean;
  avgRating: number;
  reviewCount: number;
};

export function LaundryReviewsTab({
  reviews,
  isLoading,
  avgRating,
  reviewCount,
}: LaundryReviewsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30">
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
            <Star className="h-6 w-6 fill-rating text-rating" aria-hidden />
          </div>
          <p className="text-muted-foreground">
            Based on{' '}
            <ClientLocaleNumber value={reviewCount} className="font-semibold text-foreground" />{' '}
            customer
            reviews
          </p>
        </CardContent>
      </Card>

      {reviews && reviews.length > 0 ? (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-0.5" role="img" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-rating text-rating' : 'text-border'}`}
                          aria-hidden
                        />
                      ))}
                    </div>
                    <ClientDate
                      iso={r.created_at}
                      mode="date"
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                  {r.comment ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                  ) : (
                    <p className="mt-3 text-sm italic text-muted-foreground">No written comment.</p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="font-medium text-foreground">No reviews yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first to order and share your experience.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
