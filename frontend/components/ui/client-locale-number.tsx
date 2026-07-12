'use client';

import { useMounted } from '@/lib/hooks/use-mounted';

type ClientLocaleNumberProps = {
  value: number;
  className?: string;
};

/** Locale-formatted integers only after mount (SSR shows plain digits). */
export function ClientLocaleNumber({ value, className }: ClientLocaleNumberProps) {
  const mounted = useMounted();
  const text = mounted ? value.toLocaleString('en-IN') : String(value);
  return <span className={className}>{text}</span>;
}
