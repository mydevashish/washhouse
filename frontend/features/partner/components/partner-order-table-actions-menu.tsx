'use client';

import Link from 'next/link';
import {
  ChevronDown,
  Copy,
  FileText,
  Loader2,
  MessageCircle,
  Printer,
  Shield,
  Tag,
  Camera,
  LayoutGrid,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  buildPartnerPrintPath,
  canPrintBillOrInvoice,
  type PrintLifecycleEmphasis,
} from '@/features/partner-shop-floor/lib/print-lifecycle';
import { cn } from '@/lib/utils';

type PartnerOrderTableActionsMenuProps = {
  orderId: string;
  trackingCode: string;
  cancelled: boolean;
  needsAction: boolean;
  showAdvance: boolean;
  showPhotos: boolean;
  nextLabel: string | null;
  printEmphasis: PrintLifecycleEmphasis | null;
  /** When false, bill / GST invoice menu items are hidden (handover statuses only). */
  showBillInvoice?: boolean;
  isBusy: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
  isAdvancing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onAdvance: () => void;
  onPhotos: () => void;
  onCustody: () => void;
  /** Dashboard / hub handoff — when set, shows hub link + copy tracking. */
  hubHref?: string | null;
  whatsappHref?: string | null;
  tagsLabel?: string;
  detailLabel?: string;
};

function MenuSeparator() {
  return <div className="my-1 border-t border-border/60" role="separator" />;
}

function menuItemClass(destructive?: boolean, emphasized?: boolean) {
  return cn(
    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    destructive && 'text-destructive hover:bg-danger-muted/40',
    emphasized && 'font-medium text-foreground',
  );
}

export function PartnerOrderTableActionsMenu({
  orderId,
  trackingCode,
  cancelled,
  needsAction,
  showAdvance,
  showPhotos,
  nextLabel,
  printEmphasis,
  showBillInvoice = true,
  isBusy,
  isAccepting,
  isRejecting,
  isAdvancing,
  onAccept,
  onReject,
  onAdvance,
  onPhotos,
  onCustody,
  hubHref,
  whatsappHref,
  tagsLabel = 'Print tags',
  detailLabel = 'View order',
}: PartnerOrderTableActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const printItems: ReactNode[] = [];
  if (!cancelled) {
    printItems.push(
      <Link
        key="tags"
        href={buildPartnerPrintPath(orderId, 'tags')}
        role="menuitem"
        className={menuItemClass(false, printEmphasis === 'tags')}
        onClick={close}
        data-testid="print-tags-link"
      >
        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        {tagsLabel}
      </Link>,
    );
    if (showBillInvoice) {
      printItems.push(
        <Link
          key="bill"
          href={buildPartnerPrintPath(orderId, 'bill')}
          role="menuitem"
          className={menuItemClass(false, printEmphasis === 'bill')}
          onClick={close}
          data-testid="print-bill-link"
        >
          <Printer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          Print counter bill
        </Link>,
        <Link
          key="invoice"
          href={buildPartnerPrintPath(orderId, 'invoice')}
          role="menuitem"
          className={menuItemClass()}
          onClick={close}
          data-testid="print-gst-invoice-link"
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          Print Invoice
        </Link>,
      );
    }
  }

  return (
    <div ref={ref} className="relative inline-flex justify-end">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 gap-1 px-2.5 text-xs sm:h-9"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        data-testid="partner-order-actions-menu-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        Actions
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions for order ${trackingCode}`}
          className="absolute right-0 top-full z-50 mt-1 w-[13.5rem] rounded-xl border border-border/60 bg-background p-1 shadow-lg"
          data-testid="partner-order-actions-menu"
        >
          <Link
            href={`/partner/orders/${orderId}`}
            role="menuitem"
            className={menuItemClass()}
            onClick={close}
          >
            {detailLabel}
          </Link>

          {hubHref ? (
            <Link href={hubHref} role="menuitem" className={menuItemClass()} onClick={close}>
              <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              Open in Customers &amp; Orders hub
            </Link>
          ) : null}

          {hubHref || whatsappHref ? (
            <>
              <MenuSeparator />
              <button
                type="button"
                role="menuitem"
                className={menuItemClass()}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(trackingCode);
                    toast.success('Tracking code copied');
                  } catch {
                    toast.error('Could not copy tracking code');
                  }
                  close();
                }}
              >
                <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                Copy tracking code
              </button>
              {whatsappHref ? (
                <Link
                  href={whatsappHref}
                  role="menuitem"
                  className={menuItemClass()}
                  onClick={close}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  WhatsApp customer
                </Link>
              ) : null}
            </>
          ) : null}

          {printItems.length > 0 ? (
            <>
              <MenuSeparator />
              {printItems}
            </>
          ) : null}

          {needsAction ? (
            <>
              <MenuSeparator />
              <button
                type="button"
                role="menuitem"
                className={menuItemClass(false, true)}
                disabled={isBusy}
                onClick={() => {
                  onAccept();
                  close();
                }}
              >
                {isAccepting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : null}
                Accept order
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass(true)}
                disabled={isBusy}
                onClick={() => {
                  onReject();
                  close();
                }}
              >
                {isRejecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : null}
                Reject order
              </button>
            </>
          ) : null}

          {showAdvance || showPhotos ? (
            <>
              <MenuSeparator />
              {showPhotos ? (
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass()}
                  disabled={isBusy}
                  onClick={() => {
                    onPhotos();
                    close();
                  }}
                >
                  <Camera className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  Pickup photos
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className={menuItemClass()}
                disabled={isBusy}
                onClick={() => {
                  onCustody();
                  close();
                }}
              >
                <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                Chain of custody
              </button>
              {showAdvance ? (
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass(false, true)}
                  disabled={isBusy}
                  onClick={() => {
                    onAdvance();
                    close();
                  }}
                >
                  {isAdvancing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : null}
                  {nextLabel ?? 'Next step'}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
