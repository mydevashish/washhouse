'use client';

import Link from 'next/link';
import { Loader2, Store, Truck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerCustomerDeskPlaceOrderForm } from '@/features/partner/customer-desk/components/partner-customer-desk-place-order-form';
import {
  usePartnerCustomerDeskLookup,
  usePartnerCustomerInsightRow,
} from '@/features/partner/customer-desk/hooks';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';
import { guestDeskProfile } from '@/features/partner/customer-desk/types';
import type { AssistedOrderCreateResult } from '@/features/partner/customer-desk/types';
import {
  PartnerOpsHero,
  PartnerOpsSectionLabel,
  PartnerOpsSurface,
  PartnerWalkInOrderWorkspace,
} from '@/features/partner/components/ops-visual';
import { OrderCreateSuccessPanel } from '@/features/partner-shop-floor/components/order-create-success-panel';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { cn } from '@/lib/utils';

type OrderMode = 'walk_in' | 'assisted';

type AssistedCreateSuccess = AssistedOrderCreateResult & {
  customer_name: string;
  customer_phone: string;
};

export function PartnerNewOrderView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = searchParams.get('mode');
  const phoneParam = searchParams.get('phone') ?? '';
  const nameParam = searchParams.get('name') ?? '';

  const initialMode: OrderMode =
    modeParam === 'assisted' ? 'assisted' : 'walk_in';

  const [mode, setMode] = useState<OrderMode>(initialMode);
  const [customerName, setCustomerName] = useState(nameParam);
  const [customerPhone, setCustomerPhone] = useState(phoneParam);
  const [assistedReady, setAssistedReady] = useState(false);
  const [lookupPhone, setLookupPhone] = useState<string | null>(null);
  const [createdAssisted, setCreatedAssisted] = useState<AssistedCreateSuccess | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (nameParam) setCustomerName(nameParam);
    if (phoneParam) setCustomerPhone(phoneParam);
  }, [nameParam, phoneParam]);

  useEffect(() => {
    if (mode === 'assisted' && phoneParam) {
      const normalized = normalizeIndianPhoneInput(phoneParam);
      if (isValidIndianMobileE164(normalized)) {
        setLookupPhone(normalized);
        setAssistedReady(true);
      }
    }
  }, [mode, phoneParam]);

  const lookupQ = usePartnerCustomerDeskLookup(
    lookupPhone ? { phone: lookupPhone } : null,
    Boolean(mode === 'assisted' && assistedReady && lookupPhone),
  );

  const profile = lookupQ.data ?? (lookupPhone ? guestDeskProfile(lookupPhone) : null);

  const assistedInsightQ = usePartnerCustomerInsightRow(
    profile,
    Boolean(mode === 'assisted' && assistedReady && profile),
  );

  function startAssistedLookup() {
    const phone = normalizeIndianPhoneInput(customerPhone);
    if (!isValidIndianMobileE164(phone)) {
      return;
    }
    setLookupPhone(phone);
    setAssistedReady(true);
  }

  if (createdAssisted) {
    return (
      <PartnerContent className="space-y-4">
        <OrderCreateSuccessPanel
          order={{
            id: createdAssisted.id,
            tracking_code: createdAssisted.tracking_code,
            customer_name: createdAssisted.customer_name,
            customer_phone: createdAssisted.customer_phone,
            total_inr: createdAssisted.total_inr,
            status: createdAssisted.status,
          }}
          anotherOrderHref="/partner/new-order?mode=assisted"
          subtitle="Print tags for pickup bags, then track this doorstep order from Customers & Orders."
        />
      </PartnerContent>
    );
  }

  const insightStatsForAssisted = assistedInsightQ.data
    ? {
        lifetime_spend_inr: assistedInsightQ.data.lifetime_spend_inr,
        segment_label: assistedInsightQ.data.segment_label,
      }
    : null;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="New order"
        description="Counter intake — customer, services or garments, then print tags."
        actions={
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>Open desk</Link>
          </Button>
        }
      />

      <PartnerOpsSurface className="space-y-4">
        <PartnerOpsHero
          eyebrow="Walk-in intake"
          title="Create a new laundry order"
          hint={
            mode === 'walk_in'
              ? 'Phone, name, gender — then services or individual garments.'
              : 'Doorstep assisted — lookup customer then schedule pickup.'
          }
          description="Live catalog from your shop — dry clean, wash & fold, or shirt-by-shirt on the garment wall."
          imageSrc="/marketing/heroes/services.webp"
          imageAlt="Laundry services"
        />
      </PartnerOpsSurface>

      <div
        className="flex w-fit rounded-lg bg-muted/60 p-0.5"
        role="tablist"
        aria-label="Order type"
      >
        {(
          [
            { id: 'walk_in' as const, label: 'Walk-in', icon: Store },
            { id: 'assisted' as const, label: 'Doorstep assisted', icon: Truck },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setAssistedReady(false);
              setLookupPhone(null);
            }}
            className={cn(
              'inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              mode === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {mode === 'walk_in' ? (
        <PartnerWalkInOrderWorkspace initialName={nameParam} initialPhone={phoneParam} />
      ) : (
        <div className="space-y-5">
          {!assistedReady || !profile ? (
            <PartnerOpsSurface className="space-y-4">
              <div>
                <PartnerOpsSectionLabel>Create order</PartnerOpsSectionLabel>
                <p className="mt-1 text-lg font-semibold tracking-tight">Find customer</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-1.5">
                    <Label htmlFor="assisted-phone">Customer phone</Label>
                    <Input
                      id="assisted-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="+91XXXXXXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="min-h-[44px] w-full sm:w-auto"
                      onClick={startAssistedLookup}
                      disabled={lookupQ.isFetching}
                    >
                      {lookupQ.isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        'Continue'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </PartnerOpsSurface>
          ) : (
            <PartnerCustomerDeskPlaceOrderForm
              layout="ops"
              profile={{
                ...profile,
                name: customerName.trim() || profile.name,
              }}
              insightStats={insightStatsForAssisted}
              onCreateBookingRequest={() =>
                router.push(buildOrdersHubPath('/partner/orders', 'requests'))
              }
              onCreated={(result) => {
                setCreatedAssisted({
                  ...result,
                  customer_name:
                    customerName.trim() || profile.name || profile.phone || 'Customer',
                  customer_phone: profile.phone,
                });
              }}
            />
          )}
        </div>
      )}
    </PartnerContent>
  );
}
