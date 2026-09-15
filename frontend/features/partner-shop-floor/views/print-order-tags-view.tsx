'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { ColorTokenBar } from '@/features/partner-shop-floor/components/color-token-bar';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { usePartnerFloorVoice } from '@/features/partner-shop-floor/hooks/use-partner-floor-voice';
import {
  readTagPerPieceSetting,
  writeTagPerPieceSetting,
} from '@/features/partner-shop-floor/lib/color-tokens';
import { FLOOR_VOICE_PRINT_TAGS } from '@/features/partner-shop-floor/lib/floor-voice';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { getPartnerOrderTags } from '@/services/partner-order-tags';
import { cn } from '@/lib/utils';
import {
  getServiceShortCode,
  getTagCountLabel,
} from '@/features/partner-shop-floor/lib/order-tag-format';

function formatPrintDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

type PrintOrderTagsViewProps = {
  orderId: string;
};

export function PrintOrderTagsView({ orderId }: PrintOrderTagsViewProps) {
  const [perPiece, setPerPiece] = useState(true);
  const { speak, hydrated } = usePartnerFloorVoice();
  const spokenRef = useRef(false);

  useEffect(() => {
    setPerPiece(readTagPerPieceSetting());
  }, []);

  useEffect(() => {
    if (!hydrated || spokenRef.current) return;
    spokenRef.current = true;
    speak(FLOOR_VOICE_PRINT_TAGS);
  }, [hydrated, speak]);

  const tagsQ = useQuery({
    queryKey: ['partner-order-tags', orderId, perPiece],
    queryFn: () => getPartnerOrderTags(orderId, { perPiece }),
    enabled: Boolean(orderId),
  });

  const payload = tagsQ.data;

  if (tagsQ.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Loading tags…
      </div>
    );
  }

  if (tagsQ.isError || !payload) {
    return (
      <QueryErrorState
        title="Could not load tags"
        message={getApiErrorMessage(tagsQ.error, 'Tags unavailable')}
        onRetry={() => void tagsQ.refetch()}
        isRetrying={tagsQ.isFetching}
      />
    );
  }

  return (
    <div
      data-testid="print-order-tags"
      data-print-format="thermal"
      className="mx-auto max-w-md space-y-4 p-4 print:max-w-none print:p-0"
    >
      <style>{`
  @media print {
    @page {
      size: 50.8mm 25.4mm;
      margin: 0;
    }

    html,
    body {
      width: 50.8mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .no-print {
      display: none !important;
    }

    [data-testid="print-order-tags"] {
      width: 50.8mm !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .print-tags-sheet {
      display: block !important;
      width: 50.8mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .tag-card {
      box-sizing: border-box !important;

      width: 50.8mm !important;
      height: 25.4mm !important;

      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;

      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;

      break-inside: avoid !important;
      page-break-inside: avoid !important;

      break-after: page !important;
      page-break-after: always !important;
    }

    .tag-card:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }
  }
`}</style>
      <div className="no-print space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Print tags</p>
            <ColorTokenChip
              colorToken={payload.color_token}
              tokenCode={payload.token_code}
              size="lg"
              showLabel
            />
          </div>
          <Button
            type="button"
            className="min-h-12 gap-2"
            onClick={() => window.print()}
            aria-label="Print tags"
          >
            <Printer className="h-5 w-5" aria-hidden />
            Print
          </Button>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={perPiece}
            onChange={(e) => {
              const next = e.target.checked;
              setPerPiece(next);
              writeTagPerPieceSetting(next);
            }}
            className="h-4 w-4"
          />
          1 tag per piece (warna 1 per line)
        </label>
        {/* <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/partner/floor/print">Print center</Link>
        </Button> */}
      </div>

      <div className="print-tags-sheet space-y-3">
        {payload.tags.filter((tag) => tag.kind !== 'bag_master').map((tag, idx) => {
          const serviceCode = getServiceShortCode(tag.service_name ?? tag.label ?? 'Item');
          const countLabel = getTagCountLabel(tag);
          const orderDate = formatPrintDate(payload.created_at);

          return (
            <article
              key={`${tag.kind}-${idx}`}
              className={cn(
                'tag-card overflow-hidden rounded-xl border border-border bg-white text-black shadow-sm',
                'print:rounded-none print:border-0 print:shadow-none',
              )}
              data-testid="tag-item"
            >
              <ColorTokenBar
                colorToken={payload.color_token}
                variant="bar"
                className="h-6 w-full print:h-[5mm]"
                label={`${payload.token_code} color bar`}
              />
              <div className="space-y-1 p-2 print:space-y-1 print:p-[2mm]">
                <div className="border-b border-neutral-200 pb-1">
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-neutral-500">
                    Order #{payload.tracking_code}
                  </p>
                  <p className="text-[10px] font-semibold leading-tight text-neutral-800">
                    {payload.customer_name}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[20px] font-black leading-none text-neutral-900">
                    {serviceCode}
                  </p>
                  {countLabel ? (
                    <p className="text-[11px] font-semibold leading-tight text-neutral-700">
                      {countLabel}
                    </p>
                  ) : null}
                </div>

                <p className="text-[8px] font-medium uppercase leading-tight tracking-wide text-neutral-600">
                  {orderDate}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
