'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { CatalogGarmentThumb } from '@/features/laundry-price-list/components/catalog-garment-thumb';
import { ColorTokenBar } from '@/features/partner-shop-floor/components/color-token-bar';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { readTagPerPieceSetting } from '@/features/partner-shop-floor/lib/color-tokens';
import { buildPartnerPrintPath } from '@/features/partner-shop-floor/lib/print-lifecycle';
import { resolveWashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import { getPartnerOrderTags, type OrderTagLine } from '@/services/partner-order-tags';

function garmentPhotoForLabel(label: string) {
  const base = label.split(' · ')[0]?.trim() ?? label;
  return resolveWashhouseCatalogPhoto('', base);
}

function TagLinePreview({
  tag,
  tokenCode,
  colorToken,
}: {
  tag: OrderTagLine;
  tokenCode: string;
  colorToken: string;
}) {
  const photo = tag.kind === 'item' ? garmentPhotoForLabel(tag.label) : undefined;
  const isBag = tag.kind === 'bag_master';

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-sm',
        isBag && 'ring-1 ring-primary/20',
      )}
      data-testid={isBag ? 'partner-dashboard-tags-verify-bag-master' : 'partner-dashboard-tags-verify-item'}
    >
      <ColorTokenBar
        colorToken={colorToken}
        variant="bar"
        className="h-6 w-full"
        label={`${tokenCode} color bar`}
      />
      <div className="space-y-1 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isBag ? 'Bag master' : 'Item'}
        </p>
        <p className="font-mono text-2xl font-extrabold leading-none tracking-tight">{tokenCode}</p>
        <p className="text-sm font-medium">
          {tag.label}
          {tag.qty_index ? ` (${tag.qty_index})` : null}
        </p>
        {tag.quantity > 1 && !tag.qty_index ? (
          <p className="text-xs text-muted-foreground">Qty {tag.quantity}</p>
        ) : null}
        {photo ? (
          <div className="py-1">
            <CatalogGarmentThumb photo={photo} size="sm" />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export type PartnerDashboardTagsVerifyPanelProps = {
  orderId: string;
};

export function PartnerDashboardTagsVerifyPanel({ orderId }: PartnerDashboardTagsVerifyPanelProps) {
  const [perPiece, setPerPiece] = useState(false);

  useEffect(() => {
    setPerPiece(readTagPerPieceSetting());
  }, []);

  const tagsQ = useQuery({
    queryKey: ['partner-order-tags', orderId, perPiece, 'dashboard-verify'],
    queryFn: () => getPartnerOrderTags(orderId, { perPiece }),
    enabled: Boolean(orderId),
    staleTime: STALE.partnerAnalytics,
  });

  const printHref = buildPartnerPrintPath(orderId, 'tags');

  return (
    <div
      className="mt-4 space-y-4 rounded-2xl border border-border bg-muted/20 p-4"
      data-testid={`partner-dashboard-tags-verify-${orderId}`}
      role="region"
      aria-label="Tag preview"
    >
      {tagsQ.isLoading ? (
        <div
          className="flex min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-busy="true"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading tag preview…
        </div>
      ) : tagsQ.isError || !tagsQ.data ? (
        <QueryErrorState
          title="Could not load tags"
          message={getApiErrorMessage(tagsQ.error, 'Tags unavailable')}
          onRetry={() => void tagsQ.refetch()}
          isRetrying={tagsQ.isFetching}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tagsQ.data.laundry_name}
              </p>
              <ColorTokenChip
                colorToken={tagsQ.data.color_token}
                tokenCode={tagsQ.data.token_code}
                size="md"
                showLabel
              />
              <p className="text-sm text-foreground">
                {tagsQ.data.customer_name}
                {tagsQ.data.customer_phone_last4
                  ? ` · …${tagsQ.data.customer_phone_last4}`
                  : null}
              </p>
              <p className="font-mono text-xs text-muted-foreground">#{tagsQ.data.tracking_code}</p>
              <p className="text-sm text-muted-foreground">
                {tagsQ.data.piece_count} piece{tagsQ.data.piece_count === 1 ? '' : 's'} ·{' '}
                {tagsQ.data.tags.length} tag{tagsQ.data.tags.length === 1 ? '' : 's'}
                {tagsQ.data.per_piece ? ' (per piece)' : null}
              </p>
            </div>
            <Button type="button" variant="outline" className="min-h-11 shrink-0 gap-2" asChild>
              <Link href={printHref} data-testid="partner-dashboard-tags-verify-full-print">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open full print view
              </Link>
            </Button>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {tagsQ.data.tags.map((tag, idx) => (
              <li key={`${tag.kind}-${idx}`}>
                <TagLinePreview
                  tag={tag}
                  tokenCode={tagsQ.data!.token_code}
                  colorToken={tagsQ.data!.color_token}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
