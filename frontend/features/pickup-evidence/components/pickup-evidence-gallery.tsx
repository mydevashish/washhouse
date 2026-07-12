'use client';

import { useMemo, useState } from 'react';
import { Camera, MapPin, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PickupEvidenceImage } from '@/features/pickup-evidence/components/pickup-evidence-image';
import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import type { PickupEvidencePhoto } from '@/services/pickup-evidence';
import { cn } from '@/lib/utils';

type PickupEvidenceGalleryProps = {
  photos: PickupEvidencePhoto[];
  className?: string;
  title?: string;
  description?: string;
};

export function PickupEvidenceGallery({
  photos,
  className,
  title = 'Pickup photos',
  description = 'Photos captured when your clothes were collected.',
}: PickupEvidenceGalleryProps) {
  const [active, setActive] = useState<PickupEvidencePhoto | null>(null);
  const sorted = useMemo(
    () => [...photos].sort((a, b) => a.sort_index - b.sort_index || a.created_at.localeCompare(b.created_at)),
    [photos],
  );

  if (!sorted.length) return null;

  const capturedAt = sorted[0]?.captured_at ?? sorted[0]?.created_at;
  const hasGps = sorted.some((p) => p.latitude != null && p.longitude != null);
  const gps = sorted.find((p) => p.latitude != null && p.longitude != null);

  return (
    <>
      <Card className={cn('rounded-2xl border-0 shadow-soft ring-1 ring-border/60', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-primary" aria-hidden />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
          {capturedAt && (
            <p className="text-xs text-muted-foreground">
              Captured {formatOrderTimestamp(capturedAt)}
              {hasGps && gps?.latitude != null && gps.longitude != null && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {Number(gps.latitude).toFixed(5)}, {Number(gps.longitude).toFixed(5)}
                </span>
              )}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ul
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
            aria-label={`${sorted.length} pickup photos`}
          >
            {sorted.map((photo, index) => (
              <li key={photo.id}>
                <PickupEvidenceImage
                  photo={photo}
                  alt={`Pickup photo ${index + 1}`}
                  className="aspect-square w-full rounded-xl"
                  onClick={() => setActive(photo)}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Pickup photo preview</DialogTitle>
            <DialogDescription>Full-size pickup evidence photo</DialogDescription>
          </DialogHeader>
          {active && (
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10 bg-background/80"
                onClick={() => setActive(null)}
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </Button>
              <PickupEvidenceImage
                photo={active}
                variant="original"
                alt="Pickup photo full size"
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
