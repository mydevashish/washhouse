'use client';

import { useState } from 'react';
import { Camera, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DisputePhotoImage } from '@/features/disputes/components/dispute-photo-image';
import type { DisputePhoto } from '@/services/disputes';
import { cn } from '@/lib/utils';

type DisputePhotosGalleryProps = {
  photos: DisputePhoto[];
  title?: string;
  description?: string;
  className?: string;
};

export function DisputePhotosGallery({
  photos,
  title = 'Attached photos',
  description = 'Photos submitted with this dispute.',
  className,
}: DisputePhotosGalleryProps) {
  const [active, setActive] = useState<DisputePhoto | null>(null);
  if (!photos.length) return null;

  const sorted = [...photos].sort((a, b) => a.sort_index - b.sort_index);

  return (
    <>
      <Card className={cn('rounded-2xl border-0 shadow-soft ring-1 ring-border/60', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-primary" aria-hidden />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label={`${sorted.length} dispute photos`}>
            {sorted.map((photo, index) => (
              <li key={photo.id}>
                <DisputePhotoImage
                  photo={photo}
                  alt={`Dispute photo ${index + 1}`}
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
            <DialogTitle>Dispute photo preview</DialogTitle>
            <DialogDescription>Full-size dispute attachment</DialogDescription>
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
              <DisputePhotoImage
                photo={active}
                variant="original"
                alt="Dispute photo full size"
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
