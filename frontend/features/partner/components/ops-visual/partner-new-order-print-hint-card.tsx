'use client';

import { FileText, Tag } from 'lucide-react';

import { PartnerOpsSectionLabel } from '@/features/partner/components/ops-visual/partner-ops-section-label';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual/partner-ops-surface';

/** Pre-create hint only — no invoice numbers until order exists (ops-visual spec). */
export function PartnerNewOrderPrintHintCard() {
  return (
    <PartnerOpsSurface variant="muted" className="!p-4">
      <PartnerOpsSectionLabel as="h3">Print &amp; invoice</PartnerOpsSectionLabel>
      <p className="mt-2 text-sm text-muted-foreground">
        Tags and invoice links appear here right after you create the order.
      </p>
      <ul className="mt-4 grid gap-2 text-sm text-muted-foreground" aria-hidden>
        <li className="flex items-center gap-2 rounded-2xl border border-dashed border-border/80 px-3 py-2 opacity-60">
          <FileText className="h-4 w-4 shrink-0" />
          Invoice PDF
        </li>
        <li className="flex items-center gap-2 rounded-2xl border border-dashed border-border/80 px-3 py-2 opacity-60">
          <Tag className="h-4 w-4 shrink-0" />
          Garment tags
        </li>
      </ul>
    </PartnerOpsSurface>
  );
}
