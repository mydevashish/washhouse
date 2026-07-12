'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Clock, MapPin, Phone, Shield, Truck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { InfoBanner } from '@/components/ui/info-banner';
import { Button } from '@/components/ui/button';
import { getContactInfo } from '@/services/customer-experience';
import type { LaundryDetail } from '@/services/laundries';

type LaundryInformationTabProps = {
  laundry: LaundryDetail;
};

const POLICIES = [
  {
    title: 'Free pickup & delivery',
    description: 'Doorstep collection and return at no extra charge on platform orders.',
  },
  {
    title: 'Quality guarantee',
    description: 'Every order is handled by trained staff with quality checks before dispatch.',
  },
  {
    title: 'Transparent pricing',
    description: 'Rates shown on the Services tab are what you pay — GST and delivery fee at checkout.',
  },
] as const;

function formatWorkingHours(hours: Record<string, string> | null | undefined): string | null {
  if (!hours || !Object.keys(hours).length) return null;
  return Object.entries(hours)
    .map(([day, value]) => `${day}: ${value}`)
    .join(' · ');
}

export function LaundryInformationTab({ laundry }: LaundryInformationTabProps) {
  const contactQ = useQuery({
    queryKey: ['contact-info', laundry.id],
    queryFn: () => getContactInfo(laundry.id),
    staleTime: 60_000,
  });

  const contact = contactQ.data;
  const hoursLabel = formatWorkingHours(contact?.working_hours);
  const address = contact?.full_address ?? `${laundry.address_line}, ${laundry.city}`;

  return (
    <div className="space-y-6">
      <InfoBanner title="Store information">
        Hours, location, and policies — everything you need before booking.
      </InfoBanner>

      <Card className="rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground">Location & contact</h2>
          <InfoRow icon={MapPin} label="Address" value={address} />
          {contact?.map_url && (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={contact.map_url} target="_blank" rel="noopener noreferrer">
                Open in Google Maps
              </a>
            </Button>
          )}
          {contact?.phone ? (
            <InfoRow icon={Phone} label="Phone" value={contact.phone} />
          ) : contact?.requires_login ? (
            <InfoRow
              icon={Phone}
              label="Phone"
              value="Sign in to view the shop phone number"
            />
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground">Hours & delivery</h2>
          <InfoRow
            icon={Clock}
            label="Store hours"
            value={hoursLabel ?? 'Contact the shop for current hours'}
          />
          <InfoRow icon={Truck} label="Pickup windows" value="Morning, afternoon & evening slots" />
          <InfoRow icon={Truck} label="Standard turnaround" value="24–48 hours · Express on select services" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-xl font-bold text-foreground">Policies</h2>
          </div>
          <ul className="mt-5 space-y-4">
            {POLICIES.map((p) => (
              <li key={p.title} className="rounded-xl bg-muted/50 p-4">
                <p className="font-semibold text-foreground">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {contact?.requires_login && (
        <Button asChild variant="outline">
          <Link href={`/login?redirect=${encodeURIComponent(`/discover/${laundry.id}`)}`}>
            Sign in to call or WhatsApp
          </Link>
        </Button>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-0.5 leading-relaxed text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
