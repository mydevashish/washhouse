'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Legacy `/partner/coupons` route — opens hub coupons workspace (Prompt 5). */
export function PartnerCouponsView() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/partner/orders?workspace=coupons');
  }, [router]);

  return (
    <div
      className="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground"
      data-testid="partner-coupons-redirect"
    >
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      Opening coupons…
    </div>
  );
}
