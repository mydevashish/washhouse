'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Legacy `/partner/services` route — opens hub services workspace (Prompt 6). */
export function PartnerServiceCatalogView() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/partner/orders?workspace=services');
  }, [router]);

  return (
    <div
      className="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground"
      data-testid="partner-services-redirect"
    >
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      Opening services…
    </div>
  );
}
