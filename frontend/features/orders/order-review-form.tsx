'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createReview } from '@/services/laundries';

type OrderReviewFormProps = {
  laundryId: string;
  orderId: string;
};

export function OrderReviewForm({ laundryId, orderId }: OrderReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitReview() {
    setSubmitting(true);
    try {
      await createReview(laundryId, {
        order_id: orderId,
        rating,
        comment: comment || undefined,
      });
      toast.success('Thanks for your review!');
      setComment('');
    } catch {
      toast.error('Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">How was your experience?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Help others choose this laundry.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="review-rating">Rating</Label>
          <Select
            id="review-rating"
            value={String(rating)}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'star' : 'stars'}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="review-comment">Comment (optional)</Label>
          <Textarea
            id="review-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what went well…"
          />
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={submitting}
          onClick={() => void submitReview()}
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </Button>
      </CardContent>
    </Card>
  );
}
