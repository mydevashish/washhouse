'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';

type QueryErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
};

export function QueryErrorState({
  title = 'Something went wrong',
  message = 'We could not load this data. Check your connection and try again.',
  onRetry,
  isRetrying = false,
}: QueryErrorStateProps) {
  return (
    <div className="py-6">
      <InfoBanner variant="destructive" icon={AlertCircle} title={title}>
        {message}
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            disabled={isRetrying}
            onClick={onRetry}
          >
            <RefreshCw className={cnIcon(isRetrying)} aria-hidden />
            {isRetrying ? 'Retrying…' : 'Try again'}
          </Button>
        )}
      </InfoBanner>
    </div>
  );
}

function cnIcon(spin: boolean) {
  return spin ? 'h-4 w-4 animate-spin' : 'h-4 w-4';
}
