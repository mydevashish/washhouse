'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { CatalogGarmentThumb } from '@/features/laundry-price-list/components/catalog-garment-thumb';
import { ColorTokenBar } from '@/features/partner-shop-floor/components/color-token-bar';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { usePartnerFloorVoice } from '@/features/partner-shop-floor/hooks/use-partner-floor-voice';
import {
  readTagPerPieceSetting,
  writeTagPerPieceSetting,
} from '@/features/partner-shop-floor/lib/color-tokens';
import { FLOOR_VOICE_PRINT_TAGS } from '@/features/partner-shop-floor/lib/floor-voice';
import { resolveWashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { getPartnerOrderTags } from '@/services/partner-order-tags';
import { cn } from '@/lib/utils';

function garmentPhotoForLabel(label: string) {
  const base = label.split(' · ')[0]?.trim() ?? label;
  return resolveWashhouseCatalogPhoto('', base);
}

type PrintOrderTagsViewProps = {
  orderId: string;
};

export function PrintOrderTagsView({ orderId }: PrintOrderTagsViewProps) {
  const [perPiece, setPerPiece] = useState(false);
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
          @page { size: 58mm auto; margin: 2mm; }
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
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/partner/floor/print">Print center</Link>
        </Button>
      </div>

      <div className="print-tags-sheet space-y-3 print:space-y-0">
        {payload.tags.map((tag, idx) => {
          const photo = tag.kind === 'item' ? garmentPhotoForLabel(tag.label) : undefined;
          return (
            <article
              key={`${tag.kind}-${idx}`}
              id={tag.kind === 'bag_master' ? 'tag-bag-master' : undefined}
              className={cn(
                'tag-card overflow-hidden rounded-xl border border-border bg-white text-black shadow-sm',
                'print:rounded-none print:border-0 print:shadow-none',
              )}
              data-testid={tag.kind === 'bag_master' ? 'tag-bag-master' : 'tag-item'}
            >
              <ColorTokenBar
                colorToken={payload.color_token}
                variant="bar"
                className="h-8 w-full print:h-[8mm]"
                label={`${payload.token_code} color bar`}
              />
              <div className="space-y-1 p-3 print:p-[3mm]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  {tag.kind === 'bag_master' ? 'Bag' : 'Item'}
                </p>
                <p
                  className="font-mono text-4xl font-extrabold leading-none tracking-tight print:text-[28px]"
                  data-testid="tag-token-code"
                >
                  {payload.token_code}
                </p>
                <p className="text-sm">
                  {payload.customer_name} · …{payload.customer_phone_last4}
                </p>
                <p className="text-sm font-medium">
                  {tag.label} {tag.qty_index ? `(${tag.qty_index})` : null}
                </p>
                {photo ? (
                  <div className="py-1">
                    <CatalogGarmentThumb photo={photo} size="md" />
                  </div>
                ) : null}
                <p className="font-mono text-xs font-semibold tracking-wide">
                  {payload.tracking_code}
                </p>
                <div
                  className="mt-2 flex h-16 w-16 items-center justify-center border border-neutral-300 bg-white print:h-[16mm] print:w-[16mm]"
                  aria-hidden
                >
                  {/* Text stand-in until QR image endpoint ships — scannable via tracking_code. */}
                  <span className="break-all px-1 text-center font-[6px] leading-tight text-neutral-700">
                    {payload.tracking_code}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{payload.laundry_name}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
