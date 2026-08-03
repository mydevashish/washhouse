'use client';

import { CheckCircle2, MessageCircle, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_CONFIG,
} from '@/features/marketing/contact/contact-constants';

type BookPickupSuccessProps = {
  publicCode: string;
  duplicateWarning?: boolean;
  onDone: () => void;
};

function buildFollowUpWhatsAppMessage(publicCode: string): string {
  return `Hi WashHouse — I just submitted pickup request ${publicCode}. Please call or WhatsApp me to confirm.`;
}

/**
 * Post-submit confirmation for Book Now — shows public_code, next steps,
 * and WhatsApp / call fallbacks (dialog stays open until Done).
 */
export function BookPickupSuccess({
  publicCode,
  duplicateWarning = false,
  onDone,
}: BookPickupSuccessProps) {
  const telHref = buildTelHref(CONTACT_CONFIG.phone);
  const whatsappHref = buildWhatsAppHref(
    CONTACT_CONFIG.whatsapp,
    buildFollowUpWhatsAppMessage(publicCode),
  );

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-5 text-left"
      data-testid="book-pickup-success"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {duplicateWarning
            ? 'We already have an open request for this number — we will follow up on both.'
            : "We'll call or WhatsApp you shortly to confirm your free pickup."}
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your request code
        </p>
        <p
          className="mt-1 font-mono text-xl font-semibold tracking-wide text-foreground"
          data-testid="book-pickup-public-code"
        >
          {publicCode}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Save this code — quote it when we call or message you.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">What happens next</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Our team reviews your request (usually within 15 minutes in business hours).</li>
          <li>We call or WhatsApp you to confirm address and pickup window.</li>
          <li>A partner picks up your laundry at the agreed time.</li>
        </ol>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Need help sooner?</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            asChild
            type="button"
            size="lg"
            variant="outline"
            className="h-11 w-full rounded-full border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
          >
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp us
            </a>
          </Button>
          <Button asChild type="button" size="lg" variant="outline" className="h-11 w-full rounded-full">
            <a href={telHref}>
              <Phone className="h-4 w-4" aria-hidden />
              Call us
            </a>
          </Button>
        </div>
      </div>

      <Button type="button" size="lg" className="h-11 w-full rounded-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
