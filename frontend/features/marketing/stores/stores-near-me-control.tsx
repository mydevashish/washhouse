'use client';

import { Loader2, LocateFixed, MapPinOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { GeolocationStatus } from '@/hooks/use-geolocation';
import { cn } from '@/lib/utils';

type StoresNearMeControlProps = {
  status: GeolocationStatus;
  errorMessage: string | null;
  onRequest: () => void;
  onClear: () => void;
  className?: string;
};

export function StoresNearMeControl({
  status,
  errorMessage,
  onRequest,
  onClear,
  className,
}: StoresNearMeControlProps) {
  const isPending = status === 'pending';
  const isActive = status === 'granted';
  const failed =
    status === 'denied' || status === 'unavailable' || status === 'error';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          className="h-11 min-h-11 gap-2 rounded-full px-4"
          aria-pressed={isActive}
          aria-busy={isPending}
          disabled={isPending}
          onClick={() => {
            if (isActive) onClear();
            else void onRequest();
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : isActive ? (
            <LocateFixed className="h-4 w-4" aria-hidden />
          ) : (
            <LocateFixed className="h-4 w-4" aria-hidden />
          )}
          {isPending ? 'Finding you…' : isActive ? 'Near me · on' : 'Near me'}
        </Button>
        {isActive && (
          <p className="text-sm text-muted-foreground" role="status">
            Sorted by distance from your location.
          </p>
        )}
      </div>
      {failed && errorMessage && (
        <p
          className="flex items-start gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
