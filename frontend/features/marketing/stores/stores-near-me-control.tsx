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
  /**
   * GPS granted but no published store coords — directory stays browsable;
   * distance sort cannot run.
   */
  partialMessage?: string | null;
  /**
   * When false, button stays idle-looking even if geo status is granted
   * (e.g. GPS applied but sort not yet `nearest`).
   */
  nearMeActive?: boolean;
  /**
   * Hide inline status / error copy — parent renders them full-width
   * (sticky compact cluster on phone/tablet).
   */
  hideMessages?: boolean;
  /** Compact pill for sticky / cluster rows — status text stays polite but tighter. */
  compact?: boolean;
  className?: string;
};

export function StoresNearMeControl({
  status,
  errorMessage,
  onRequest,
  onClear,
  partialMessage = null,
  nearMeActive,
  hideMessages = false,
  compact = false,
  className,
}: StoresNearMeControlProps) {
  const isPending = status === 'pending';
  const isActive = nearMeActive ?? status === 'granted';
  const failed =
    status === 'denied' || status === 'unavailable' || status === 'error';
  const activeHint = isActive
    ? partialMessage || 'Sorted by distance from your location.'
    : null;
  const showInlineMessages = !hideMessages;

  return (
    <div className={cn(compact ? 'space-y-1.5' : 'space-y-2', className)}>
      <div
        className={cn(
          'flex items-center gap-2',
          compact ? 'flex-nowrap' : 'flex-wrap',
        )}
      >
        <Button
          type="button"
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-11 min-h-11 shrink-0 gap-2 rounded-full',
            compact ? 'px-3.5' : 'px-4',
            // Soft pulse while GPS resolves — state signal, not decoration
            isPending && 'animate-washhouse-pulse motion-reduce:animate-none',
          )}
          aria-pressed={isActive}
          aria-busy={isPending}
          onClick={() => {
            if (isPending || isActive) onClear();
            else void onRequest();
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <LocateFixed className="h-4 w-4" aria-hidden />
          )}
          <span className={cn(compact && 'whitespace-nowrap')}>
            {isPending ? 'Cancel' : isActive ? 'Near me · on' : 'Near me'}
          </span>
        </Button>
        {showInlineMessages && activeHint && !compact && (
          <p className="text-sm text-muted-foreground" role="status">
            {activeHint}
          </p>
        )}
        {showInlineMessages && activeHint && compact && (
          <span className="sr-only" role="status">
            {activeHint}
          </span>
        )}
      </div>
      {showInlineMessages && failed && errorMessage && (
        <p
          className={cn(
            'flex items-start gap-2 text-muted-foreground',
            compact ? 'text-xs' : 'text-sm',
          )}
          role="status"
          aria-live="polite"
        >
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </p>
      )}
      {showInlineMessages && isActive && partialMessage && compact && (
        <p
          className="flex items-start gap-2 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <MapPinOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{partialMessage}</span>
        </p>
      )}
    </div>
  );
}
