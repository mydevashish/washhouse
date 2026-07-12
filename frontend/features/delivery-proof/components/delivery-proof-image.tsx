'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { fetchDeliveryProofImage, type DeliveryProofPhoto } from '@/services/delivery-proof';
import { cn } from '@/lib/utils';

type DeliveryProofImageProps = {
  photo: DeliveryProofPhoto;
  variant?: 'compressed' | 'original';
  alt: string;
  className?: string;
  onClick?: () => void;
};

export function DeliveryProofImage({
  photo,
  variant = 'compressed',
  alt,
  className,
  onClick,
}: DeliveryProofImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    void fetchDeliveryProofImage(photo, variant)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.id, variant, photo.compressed_url, photo.original_url]);

  if (failed) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted text-xs text-muted-foreground', className)}
        role="img"
        aria-label={`${alt} unavailable`}
      >
        Unavailable
      </div>
    );
  }

  if (!src) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)} aria-hidden>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn('block overflow-hidden', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </button>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={cn('object-cover', className)} loading="lazy" />
  );
}
