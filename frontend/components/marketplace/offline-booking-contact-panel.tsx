'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';

import { InfoBanner } from '@/components/ui/info-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  OFFLINE_BOOKING_TITLE,
  offlineBookingBody,
} from '@/lib/hooks/use-online-booking-enabled';
import { cn } from '@/lib/utils';
import { getContactInfo, trackContactEvent } from '@/services/customer-experience';
import { useAuthStore } from '@/store/auth.store';

type OfflineBookingContactPanelProps = {
  laundryId: string;
  laundryName: string;
  className?: string;
  variant?: 'inline' | 'sidebar' | 'mobile-bar';
};

function WorkingHoursList({ hours }: { hours: Record<string, string> }) {
  const entries = Object.entries(hours);
  if (!entries.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
      {entries.map(([day, value]) => (
        <li key={day} className="flex gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="font-medium text-foreground">{day}:</span> {value}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function OfflineBookingContactPanel({
  laundryId,
  laundryName,
  className,
  variant = 'inline',
}: OfflineBookingContactPanelProps) {
  const user = useAuthStore((s) => s.user);

  const contactQ = useQuery({
    queryKey: ['contact-info', laundryId],
    queryFn: () => getContactInfo(laundryId),
    staleTime: 60_000,
  });

  const trackM = useMutation({
    mutationFn: (event_type: string) =>
      trackContactEvent(laundryId, { event_type, source: 'offline_booking' }),
  });

  const c = contactQ.data;

  const handleCall = async () => {
    if (!c?.phone) return;
    let phone = c.phone;
    if (user?.role === 'customer') {
      const updated = await trackM.mutateAsync('call_click');
      phone = updated.phone ?? phone;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = async () => {
    if (!c?.whatsapp_url) return;
    let url = c.whatsapp_url;
    if (user?.role === 'customer') {
      const updated = await trackM.mutateAsync('whatsapp_click');
      url = updated.whatsapp_url ?? url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMaps = () => {
    if (c?.map_url) window.open(c.map_url, '_blank', 'noopener,noreferrer');
  };

  const isMobileBar = variant === 'mobile-bar';

  const actionButtons = c && (
    <div className={cn('gap-2', isMobileBar ? 'grid grid-cols-2' : 'flex flex-wrap')}>
      {c.show_call && (
        <Button
          type="button"
          size={isMobileBar ? 'lg' : 'sm'}
          className={cn('gap-2 font-semibold', isMobileBar && 'h-12 w-full rounded-xl')}
          disabled={trackM.isPending}
          onClick={() => void handleCall()}
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call shop
        </Button>
      )}
      {c.show_whatsapp && (
        <Button
          type="button"
          size={isMobileBar ? 'lg' : 'sm'}
          variant={isMobileBar ? 'default' : 'outline'}
          className={cn(
            'gap-2 font-semibold',
            isMobileBar
              ? 'h-12 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700'
              : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
          )}
          disabled={trackM.isPending}
          onClick={() => void handleWhatsApp()}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp shop
        </Button>
      )}
      {c.map_url && !isMobileBar && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={handleMaps}
        >
          <Navigation className="h-4 w-4" aria-hidden />
          Open in Google Maps
        </Button>
      )}
    </div>
  );

  if (variant === 'mobile-bar') {
    if (!c?.can_contact) return null;
    return (
      <div
        className={cn(
          'bottom-above-nav fixed left-0 right-0 z-30 border-t border-border bg-background/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden',
          className,
        )}
      >
        <div className="space-y-2.5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <p className="text-center text-xs font-medium text-muted-foreground">
            {OFFLINE_BOOKING_TITLE}
          </p>
          {actionButtons}
        </div>
      </div>
    );
  }

  const contactCard = c && (c.can_contact || c.full_address) && (
    <Card className="rounded-2xl border-border/60 shadow-soft">
      <CardContent className={cn('space-y-4', variant === 'sidebar' ? 'p-5' : 'p-4 sm:p-5')}>
        <div>
          <p className="text-sm font-semibold text-foreground">Contact {laundryName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Call or WhatsApp the shop directly to place an order.
          </p>
        </div>

        {c.full_address && (
          <div className="flex gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-medium text-foreground">Address</p>
              <p className="mt-0.5 leading-relaxed text-muted-foreground">{c.full_address}</p>
            </div>
          </div>
        )}

        {c.working_hours && Object.keys(c.working_hours).length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground">Working hours</p>
            <WorkingHoursList hours={c.working_hours} />
          </div>
        )}

        {actionButtons}
      </CardContent>
    </Card>
  );

  const bannerBody = offlineBookingBody(laundryName);

  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-4', className)}>
        <InfoBanner title={OFFLINE_BOOKING_TITLE}>{bannerBody}</InfoBanner>
        {contactQ.isLoading ? null : contactCard}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <InfoBanner title={OFFLINE_BOOKING_TITLE}>{bannerBody}</InfoBanner>
      {contactQ.isLoading ? null : contactCard}
    </div>
  );
}
