'use client';

import { useMounted } from '@/lib/hooks/use-mounted';
import { formatIndiaDate, formatIndiaDateTime, formatIndiaDelivery } from '@/lib/datetime';

type ClientDateProps = {
  iso: string;
  mode?: 'datetime' | 'date' | 'delivery';
  className?: string;
};

/** Renders India TZ dates only after mount to avoid SSR/client hydration mismatches. */
export function ClientDate({ iso, mode = 'datetime', className }: ClientDateProps) {
  const mounted = useMounted();

  if (!mounted) {
    return <span className={className}>…</span>;
  }

  const text =
    mode === 'date'
      ? formatIndiaDate(iso)
      : mode === 'delivery'
        ? formatIndiaDelivery(iso)
        : formatIndiaDateTime(iso);

  return <span className={className}>{text}</span>;
}
