'use client';

import { useState } from 'react';
import { Camera, MapPin, Smartphone, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeliveryProofImage } from '@/features/delivery-proof/components/delivery-proof-image';
import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import type { DeliveryProofPhoto } from '@/services/delivery-proof';
import { cn } from '@/lib/utils';

type DeliveryProofDisplayProps = {
  photo: DeliveryProofPhoto;
  className?: string;
  title?: string;
  description?: string;
  showDeviceInfo?: boolean;
};

export function DeliveryProofDisplay({
  photo,
  className,
  title = 'Delivery proof',
  description = 'Photo captured when your order was delivered.',
  showDeviceInfo = false,
}: DeliveryProofDisplayProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const capturedAt = photo.captured_at ?? photo.created_at;
  const hasGps = photo.latitude != null && photo.longitude != null;

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
              {hasGps && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {Number(photo.latitude).toFixed(5)}, {Number(photo.longitude).toFixed(5)}
                </span>
              )}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <DeliveryProofImage
            photo={photo}
            alt="Delivery proof photo"
            className="aspect-video w-full max-w-md rounded-xl"
            onClick={() => setPreviewOpen(true)}
          />
          {showDeviceInfo && photo.device_info && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <Smartphone className="h-3.5 w-3.5" aria-hidden />
                Device record
              </p>
              {photo.device_info.platform && <p>Platform: {photo.device_info.platform}</p>}
              {photo.device_info.screen && <p>Screen: {photo.device_info.screen}</p>}
              {photo.device_info.timezone && <p>Timezone: {photo.device_info.timezone}</p>}
              <p className="truncate">Agent ID: {photo.uploaded_by_user_id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Delivery proof preview</DialogTitle>
            <DialogDescription>Full-size delivery proof photo</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-background/80"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </Button>
            <DeliveryProofImage
              photo={photo}
              variant="original"
              alt="Delivery proof full size"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
