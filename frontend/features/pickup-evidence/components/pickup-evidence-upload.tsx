'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadPickupEvidence } from '@/services/pickup-evidence';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 10;
const MIN_PHOTOS = 1;

type PickupEvidenceUploadProps = {
  orderId: string;
  onUploaded?: () => void;
  disabled?: boolean;
  className?: string;
};

type PendingPhoto = {
  id: string;
  file: File;
  preview: string;
};

function readGeolocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}

export function PickupEvidenceUpload({
  orderId,
  onUploaded,
  disabled,
  className,
}: PickupEvidenceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: PendingPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (pending.length + next.length >= MAX_PHOTOS) break;
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    if (next.length) setPending((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
  }, [pending.length]);

  function removePhoto(id: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function captureGps() {
    setGpsLoading(true);
    try {
      const coords = await readGeolocation();
      if (coords) {
        setGps(coords);
        toast.success('Location captured');
      } else {
        toast.error('Could not get GPS location');
      }
    } finally {
      setGpsLoading(false);
    }
  }

  async function submit() {
    if (pending.length < MIN_PHOTOS) {
      toast.error(`Add at least ${MIN_PHOTOS} photo`);
      return;
    }
    setUploading(true);
    try {
      let coords = gps;
      if (!coords) {
        coords = await readGeolocation();
        if (coords) setGps(coords);
      }
      await uploadPickupEvidence(
        orderId,
        pending.map((p) => p.file),
        {
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          capturedAt: new Date().toISOString(),
        },
      );
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      toast.success('Pickup photos uploaded');
      onUploaded?.();
    } catch {
      toast.error('Upload failed — try again');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className={cn('rounded-2xl border-primary/30 ring-1 ring-primary/15', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-5 w-5 text-primary" aria-hidden />
          Pickup evidence
        </CardTitle>
        <CardDescription>
          Capture {MIN_PHOTOS}–{MAX_PHOTOS} photos before marking the order picked up. Photos cannot
          be changed after upload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          aria-hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] gap-2"
            disabled={disabled || uploading || pending.length >= MAX_PHOTOS}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            Add photos ({pending.length}/{MAX_PHOTOS})
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-[44px] gap-2"
            disabled={disabled || uploading || gpsLoading}
            onClick={() => void captureGps()}
          >
            {gpsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MapPin className="h-4 w-4" aria-hidden />
            )}
            {gps ? 'Location captured' : 'Capture GPS'}
          </Button>
        </div>

        {pending.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Photos ready to upload">
            {pending.map((photo, index) => (
              <li key={photo.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt={`Pending pickup photo ${index + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-1 top-1 h-7 w-7"
                  disabled={uploading}
                  onClick={() => removePhoto(photo.id)}
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          className="min-h-[44px] w-full"
          disabled={disabled || uploading || pending.length < MIN_PHOTOS}
          onClick={() => void submit()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Uploading…
            </>
          ) : (
            'Upload pickup photos'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
