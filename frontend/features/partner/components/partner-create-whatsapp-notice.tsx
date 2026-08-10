'use client';

import { useCallback, useMemo, useState } from 'react';
import { Loader2, MessageCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { buildCustomerWhatsAppUrl } from '@/features/partner/customer-desk/phone';
import {
  buildWalkInOrderReceivedWhatsAppBody,
  walkInOrderWhatsAppEligible,
} from '@/features/partner/lib/walk-in-order-received-whatsapp';
import { getApiErrorMessage } from '@/lib/api-error-message';
import {
  retryWalkInOrderReceivedWhatsApp,
  type WalkInOrder,
} from '@/services/partner-walk-in-orders';

type DeliveryState = 'scheduled' | 'sent' | 'error' | 'skipped';

type PartnerCreateWhatsAppNoticeProps = {
  order: WalkInOrder;
  className?: string;
};

export function PartnerCreateWhatsAppNotice({ order, className }: PartnerCreateWhatsAppNoticeProps) {
  const eligible = walkInOrderWhatsAppEligible(order);

  const [delivery, setDelivery] = useState<DeliveryState>(() => {
    if (!eligible || order.whatsapp_order_received?.eligible === false) return 'skipped';
    return 'scheduled';
  });
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const messageBody = useMemo(
    () =>
      order.whatsapp_order_received?.message_body ??
      buildWalkInOrderReceivedWhatsAppBody(order),
    [order],
  );

  const waHref = eligible ? buildCustomerWhatsAppUrl(order.customer_phone, messageBody) : null;

  const onRetry = useCallback(async () => {
    setRetrying(true);
    setError(null);
    try {
      const result = await retryWalkInOrderReceivedWhatsApp(order.id);
      if (result.sent) {
        setDelivery('sent');
        return;
      }
      if (result.error) {
        setDelivery('error');
        setError(result.error);
        return;
      }
      setDelivery('skipped');
      setError(result.skip_reason ?? 'WhatsApp could not be sent');
    } catch (err) {
      setDelivery('error');
      setError(getApiErrorMessage(err, 'Could not send WhatsApp update'));
    } finally {
      setRetrying(false);
    }
  }, [order.id]);

  if (!eligible) {
    return (
      <p className={className} data-testid="partner-create-whatsapp-skipped">
        <span className="text-sm text-muted-foreground">
          Add a valid mobile number (+91…) to send the customer a WhatsApp order summary.
        </span>
      </p>
    );
  }

  return (
    <div
      className={className}
      data-testid="partner-create-whatsapp-notice"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div>
            {delivery === 'sent' ? (
              <p className="font-medium text-foreground">Message sent to customer</p>
            ) : delivery === 'scheduled' ? (
              <p className="font-medium text-foreground">WhatsApp update queued for customer</p>
            ) : delivery === 'error' ? (
              <p className="font-medium text-destructive">WhatsApp could not be delivered</p>
            ) : (
              <p className="font-medium text-muted-foreground">WhatsApp skipped</p>
            )}
            <p className="text-muted-foreground">
              {delivery === 'scheduled'
                ? 'We notify the customer when the order is saved. Retry if they did not receive it.'
                : delivery === 'sent'
                  ? 'Order received summary with items, bag token, and total.'
                  : error ?? 'Check the number or send manually below.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(delivery === 'scheduled' || delivery === 'error') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void onRetry()}
              disabled={retrying}
              data-testid="partner-create-whatsapp-retry"
            >
              {retrying ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              {delivery === 'error' ? 'Retry WhatsApp' : 'Send now'}
            </Button>
          )}
          {waHref ? (
            <Button type="button" variant="ghost" size="sm" className="gap-1.5" asChild>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="partner-create-whatsapp-manual"
              >
                Open in WhatsApp
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
