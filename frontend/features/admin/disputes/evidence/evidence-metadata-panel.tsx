'use client';

import { Clock, MapPin, User } from 'lucide-react';

import { ClientDate } from '@/components/ui/client-date';
import { cn } from '@/lib/utils';

export type EvidenceMetadata = {
  capturedAt: string;
  latitude: string | number | null;
  longitude: string | number | null;
  uploadedByName?: string | null;
  uploadedByUserId?: string;
};

type Props = {
  metadata: EvidenceMetadata;
  className?: string;
  compact?: boolean;
};

function formatGps(lat: string | number | null, lng: string | number | null): string | null {
  if (lat == null || lng == null) return null;
  const la = Number(lat);
  const lo = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(lo)) return null;
  return `${la.toFixed(5)}, ${lo.toFixed(5)}`;
}

export function EvidenceMetadataPanel({ metadata, className, compact }: Props) {
  const gps = formatGps(metadata.latitude, metadata.longitude);
  const mapsUrl =
    gps != null
      ? `https://www.google.com/maps?q=${Number(metadata.latitude)},${Number(metadata.longitude)}`
      : null;

  return (
    <dl
      className={cn(
        'grid gap-1.5 text-[11px]',
        compact ? 'grid-cols-1' : 'sm:grid-cols-3',
        className,
      )}
    >
      <div>
        <dt className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden />
          Timestamp
        </dt>
        <dd className="mt-0.5 font-medium">
          <ClientDate iso={metadata.capturedAt} mode="datetime" />
        </dd>
      </div>
      <div>
        <dt className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden />
          GPS
        </dt>
        <dd className="mt-0.5 font-medium">
          {gps ? (
            mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                {gps}
              </a>
            ) : (
              gps
            )
          ) : (
            <span className="text-muted-foreground">Not recorded</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="flex items-center gap-1 text-muted-foreground">
          <User className="h-3 w-3" aria-hidden />
          Uploader
        </dt>
        <dd className="mt-0.5 font-medium">
          {metadata.uploadedByName ?? metadata.uploadedByUserId?.slice(0, 8) ?? 'Unknown'}
        </dd>
      </div>
    </dl>
  );
}
