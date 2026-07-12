'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collectDeviceInfo, uploadDeliveryProof } from '@/services/delivery-proof';
import { cn } from '@/lib/utils';

type DeliveryProofUploadProps = {
  orderId: string;
  onUploaded?: () => void;
  disabled?: boolean;
  className?: string;
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

export function DeliveryProofUpload({
  orderId,
  onUploaded,
  disabled,
  className,
}: DeliveryProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const addFile = useCallback((next: File) => {
    if (!next.type.startsWith('image/')) {
      toast.error('Select an image file');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }, [preview]);

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
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
    if (!file) {
      toast.error('Add a delivery photo');
      return;
    }
    setUploading(true);
    try {
      let coords = gps;
      if (!coords) {
        coords = await readGeolocation();
        if (coords) setGps(coords);
      }
      await uploadDeliveryProof(orderId, file, {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        capturedAt: new Date().toISOString(),
        deviceInfo: collectDeviceInfo(),
      });
      clearFile();
      toast.success('Delivery proof uploaded');
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
          Delivery proof
        </CardTitle>
        <CardDescription>
          Capture one photo at delivery before entering the customer OTP. Cannot be changed after upload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          aria-hidden
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) addFile(picked);
            e.target.value = '';
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] gap-2"
            disabled={disabled || uploading || Boolean(file)}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {file ? 'Photo selected' : 'Add delivery photo'}
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

        {preview && file && (
          <div className="relative max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Pending delivery photo"
              className="aspect-video w-full rounded-lg object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute right-1 top-1 h-7 w-7"
              disabled={uploading}
              onClick={clearFile}
              aria-label="Remove photo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <Button
          type="button"
          className="min-h-[44px] w-full"
          disabled={disabled || uploading || !file}
          onClick={() => void submit()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Uploading…
            </>
          ) : (
            'Upload delivery proof'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
