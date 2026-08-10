'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Shirt, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatInr } from '@/features/discover/detail/order-pricing';
import {
  PartnerCustomerSnapshotCards,
  PartnerNewOrderLineItemsTable,
  PartnerNewOrderPrintHintCard,
  PartnerNewOrderServiceAddDialog,
  PartnerGarmentAddTile,
  PartnerGarmentIntakeEmpty,
  PartnerOpsSectionLabel,
  PartnerOpsSurface,
  PartnerOrderCheckoutAside,
  PartnerOrderWorkspacePanels,
  PartnerServiceTile,
} from '@/features/partner/components/ops-visual';
import { OrderCreateSuccessPanel } from '@/features/partner-shop-floor/components/order-create-success-panel';
import { ClothWallCategoryChips } from '@/features/partner-shop-floor/components/cloth-wall-category-chips';
import { ClothWallTileButton } from '@/features/partner-shop-floor/components/cloth-wall-tile';
import { WalkInSuccessPanel } from '@/features/partner-shop-floor/components/walk-in-success-panel';
import { PartnerCustomerGenderField } from '@/features/partner/components/partner-customer-gender-field';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';
import { buildPartnerCreateOrderHref } from '@/features/partner/customer-desk/phone';
import {
  usePartnerWalkInOrderComposer,
  type PartnerWalkInOrderComposer,
  type WalkInComposerFulfillment,
  type WalkInComposerStep,
} from '@/features/partner/hooks/use-partner-walk-in-order-composer';
import type { ServiceCatalogItem } from '@/services/partner-service-catalog';
import { applySuggestedPartnerPrices } from '@/features/partner-price-list/api/partner-price-list';
import { PartnerGarmentOfferDialog } from '@/features/partner-price-list/components/partner-garment-offer-dialog';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { listPartnerCoupons } from '@/services/partner-coupons';
import { queryKeys } from '@/lib/query-keys';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { cn } from '@/lib/utils';

type Props = {
  embedded?: boolean;
  showPostCreatePanels?: boolean;
  hideTopChrome?: boolean;
  initialName?: string;
  initialPhone?: string;
  initialFulfillment?: WalkInComposerFulfillment;
  /** When set (e.g. dashboard dialog), reuse this composer instance. */
  composer?: PartnerWalkInOrderComposer;
  presentation?: 'page' | 'dialog';
  /** Skip full-page success UI — parent handles post-create (dashboard modal). */
  suppressSuccessScreen?: boolean;
  lookupOnlyOnCustomerStep?: boolean;
  debounceLookupMs?: number;
};

const STEPS: { id: WalkInComposerStep; label: string }[] = [
  { id: 'customer', label: 'Customer' },
  { id: 'intake', label: 'Items' },
  { id: 'review', label: 'Review & print' },
];

function StepRail({
  step,
  onJump,
  lockedAfter,
}: {
  step: WalkInComposerStep;
  onJump: (s: WalkInComposerStep) => void;
  lockedAfter: WalkInComposerStep | null;
}) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <ol
      className="flex flex-wrap items-center gap-2 text-xs font-medium"
      aria-label="Create order steps"
    >
      {STEPS.map((s, i) => {
        const done = i < idx;
        const current = s.id === step;
        const disabled =
          lockedAfter != null && STEPS.findIndex((x) => x.id === lockedAfter) < i;
        return (
          <li key={s.id} className="flex items-center gap-2">
            {i > 0 ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            ) : null}
            <button
              type="button"
              disabled={disabled || (!done && !current)}
              onClick={() => {
                if (done) onJump(s.id);
              }}
              className={cn(
                'rounded-full px-3 py-1 transition-colors',
                current
                  ? 'bg-primary text-primary-foreground'
                  : done
                    ? 'bg-muted text-foreground hover:bg-muted/80'
                    : 'bg-muted/50 text-muted-foreground',
              )}
              aria-current={current ? 'step' : undefined}
            >
              {s.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function PartnerWalkInOrderWorkspace({
  embedded = false,
  showPostCreatePanels = false,
  hideTopChrome = false,
  initialName = '',
  initialPhone = '',
  initialFulfillment = 'walk_in',
  composer: composerProp,
  presentation = 'page',
  suppressSuccessScreen = false,
  lookupOnlyOnCustomerStep = true,
  debounceLookupMs,
}: Props) {
  const composerFromHook = usePartnerWalkInOrderComposer({
    initialName,
    initialPhone,
    initialFulfillment,
    lookupActive: true,
    lookupOnlyOnCustomerStep,
    debounceLookupMs,
  });
  const c = composerProp ?? composerFromHook;

  return (
    <PartnerWalkInOrderWorkspaceContent
      c={c}
      embedded={embedded}
      showPostCreatePanels={showPostCreatePanels}
      hideTopChrome={hideTopChrome}
      presentation={presentation}
      suppressSuccessScreen={suppressSuccessScreen}
    />
  );
}

function PartnerWalkInOrderWorkspaceContent({
  c,
  embedded,
  showPostCreatePanels,
  hideTopChrome,
  presentation,
  suppressSuccessScreen,
}: {
  c: PartnerWalkInOrderComposer;
  embedded: boolean;
  showPostCreatePanels: boolean;
  hideTopChrome: boolean;
  presentation: 'page' | 'dialog';
  suppressSuccessScreen: boolean;
}) {
  const partnerQueriesEnabled = usePartnerQueriesEnabled();
  const activeCouponsQ = useQuery({
    queryKey: queryKeys.partnerCoupons(),
    queryFn: listPartnerCoupons,
    enabled: partnerQueriesEnabled && presentation === 'dialog',
  });
  const activeCoupons = (activeCouponsQ.data ?? []).filter((row) => row.is_active);

  const renderPostCreatePanels = showPostCreatePanels || !embedded;
  const isDialog = presentation === 'dialog';

  const [dialogService, setDialogService] = useState<ServiceCatalogItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [garmentOfferOpen, setGarmentOfferOpen] = useState(false);
  const qc = useQueryClient();

  const applySuggestedM = useMutation({
    mutationFn: applySuggestedPartnerPrices,
    onSuccess: async (result) => {
      toast.success(
        result.created > 0
          ? `Applied suggested prices to ${result.created} garments`
          : 'Suggested prices already applied',
      );
      await qc.invalidateQueries({ queryKey: queryKeys.partnerPriceList() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not apply suggested prices')),
  });

  const walkInSnapshotProfile =
    c.customerName.trim() && c.walkInSnapshotProfile
      ? {
          ...c.walkInSnapshotProfile,
          name: c.customerName.trim() || c.walkInSnapshotProfile.name,
        }
      : null;

  if (c.createdDoorstepOrder && !(suppressSuccessScreen && isDialog)) {
    return (
      <div className="space-y-5" id="partner-walk-in-workspace" data-testid="partner-walk-in-workspace">
        <OrderCreateSuccessPanel
          order={{
            id: c.createdDoorstepOrder.id,
            tracking_code: c.createdDoorstepOrder.tracking_code,
            customer_name: c.customerName.trim(),
            customer_phone: c.customerPhone,
            total_inr: c.createdDoorstepOrder.total_inr,
            status: c.createdDoorstepOrder.status,
          }}
          anotherOrderHref={buildPartnerCreateOrderHref({
            phone: c.customerPhone,
            name: c.customerName,
            fulfillment: 'doorstep',
          })}
          subtitle="Pickup and delivery scheduled — track from the Orders tab."
        />
        <Button type="button" variant="outline" onClick={c.resetWorkspace}>
          Create another order
        </Button>
      </div>
    );
  }

  if (c.createdOrder && !(suppressSuccessScreen && isDialog)) {
    return (
      <div className="space-y-5" id="partner-walk-in-workspace" data-testid="partner-walk-in-workspace">
        <WalkInSuccessPanel
          order={c.createdOrder}
          onStartWash={() => c.startWashMutation.mutate(c.createdOrder!.id)}
          startWashPending={c.startWashMutation.isPending}
        />
        {renderPostCreatePanels ? (
          <PartnerOrderWorkspacePanels
            order={c.createdOrder}
            customer={c.customerPanel}
            lineRows={c.lineRows}
            paymentMethod="Counter"
            deliveryType="Walk-in"
            estimatedGrandTotal={Number(c.createdOrder.total_inr)}
            onCreateAnother={c.resetWorkspace}
          />
        ) : null}
      </div>
    );
  }

  if (suppressSuccessScreen && isDialog && (c.createdOrder || c.createdDoorstepOrder)) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground" role="status">
        Order saved…
      </p>
    );
  }

  return (
    <div className="space-y-5" id="partner-walk-in-workspace" data-testid="partner-walk-in-workspace">
      {!hideTopChrome || isDialog ? (
        <PartnerOpsSurface className="space-y-4">
          {!hideTopChrome && !isDialog ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold tracking-tight">
                  {c.fulfillment === 'doorstep' ? 'Create doorstep order' : 'Create walk-in order'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Phone &amp; name → services{c.fulfillment === 'walk_in' ? ' or garments' : ''} →
                  print tags.
                </p>
              </div>
              <StepRail step={c.step} onJump={c.setStep} lockedAfter={null} />
            </div>
          ) : (
            <StepRail step={c.step} onJump={c.setStep} lockedAfter={null} />
          )}
          <div
            className="flex rounded-lg bg-muted/60 p-0.5"
            role="tablist"
            aria-label="Order type"
          >
            {(
              [
                { id: 'walk_in' as const, label: 'Walk-in' },
                { id: 'doorstep' as const, label: 'Doorstep' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={c.fulfillment === id}
                onClick={() => c.switchFulfillment(id)}
                className={cn(
                  'inline-flex min-h-9 flex-1 items-center justify-center rounded-md px-3 text-xs font-medium sm:flex-none',
                  c.fulfillment === id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </PartnerOpsSurface>
      ) : (
        <StepRail step={c.step} onJump={c.setStep} lockedAfter={null} />
      )}

      <PartnerNewOrderServiceAddDialog
        service={dialogService}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={(qty: number) => {
          if (dialogService) c.addServiceWithQty(dialogService.id, qty);
        }}
      />

      {c.step === 'customer' ? (
        <PartnerOpsSurface className="space-y-5">
          <PartnerOpsSectionLabel>Step 1 — Customer</PartnerOpsSectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ws-phone">Phone (WhatsApp)</Label>
              <Input
                id="ws-phone"
                type="tel"
                inputMode="tel"
                value={c.customerPhone}
                onChange={(e) => c.setCustomerPhone(normalizeIndianPhoneInput(e.target.value))}
                required
                className="min-h-9"
                data-testid="create-order-phone"
                aria-describedby={isDialog ? 'ws-phone-lookup-hint' : undefined}
              />
              {isDialog && c.walkInLookupPhone ? (
                <p id="ws-phone-lookup-hint" className="text-xs text-muted-foreground">
                  {c.walkInLookupQ.isFetching ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      Looking up customer…
                    </span>
                  ) : c.walkInProfile?.registered ? (
                    'Existing customer — order will link to this phone.'
                  ) : (
                    'New phone — enter name to create profile on save.'
                  )}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Customer name</Label>
              <Input
                id="ws-name"
                value={c.customerName}
                onChange={(e) => c.setCustomerName(e.target.value)}
                required
                className="min-h-9"
                data-testid="create-order-name"
              />
            </div>
          </div>

          <PartnerCustomerGenderField value={c.customerGender} onChange={c.setCustomerGender} />

          {isDialog ? (
            <div className="space-y-1.5">
              <Label htmlFor="ws-email">Email (optional)</Label>
              <Input
                id="ws-email"
                type="email"
                autoComplete="email"
                value={c.customerEmail}
                onChange={(e) => c.setCustomerEmail(e.target.value)}
                className="min-h-9"
                placeholder="For receipts — not required for walk-in"
              />
            </div>
          ) : null}

          {isDialog && c.fulfillment === 'walk_in' ? (
            <div className="space-y-1.5">
              <Label htmlFor="ws-ready">Promised ready (optional)</Label>
              <Input
                id="ws-ready"
                type="date"
                value={c.expectedReadyAt}
                onChange={(e) => c.setExpectedReadyAt(e.target.value)}
                className="min-h-9"
              />
            </div>
          ) : null}

          {c.fulfillment === 'doorstep' ? (
            <fieldset className="space-y-3 rounded-xl border border-border/60 p-3">
              <legend className="px-1 text-sm font-medium">Pickup &amp; delivery address</legend>
              <div className="space-y-1.5">
                <Label htmlFor="ws-address1">Address line 1</Label>
                <Input
                  id="ws-address1"
                  value={c.addressLine1}
                  onChange={(e) => c.setAddressLine1(e.target.value)}
                  className="min-h-9"
                  data-testid="create-order-address-line1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ws-address2">Address line 2 (optional)</Label>
                <Input
                  id="ws-address2"
                  value={c.addressLine2}
                  onChange={(e) => c.setAddressLine2(e.target.value)}
                  className="min-h-9"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ws-city">City</Label>
                  <Input
                    id="ws-city"
                    value={c.addressCity}
                    onChange={(e) => c.setAddressCity(e.target.value)}
                    className="min-h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ws-pincode">Pincode</Label>
                  <Input
                    id="ws-pincode"
                    inputMode="numeric"
                    value={c.addressPincode}
                    onChange={(e) => c.setAddressPincode(e.target.value)}
                    className="min-h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ws-landmark">Landmark (optional)</Label>
                <Input
                  id="ws-landmark"
                  value={c.addressLandmark}
                  onChange={(e) => c.setAddressLandmark(e.target.value)}
                  className="min-h-9"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ws-pickup">Pickup time</Label>
                  <Input
                    id="ws-pickup"
                    type="datetime-local"
                    value={c.pickupAtLocal}
                    onChange={(e) => c.setPickupAtLocal(e.target.value)}
                    className="min-h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ws-delivery">Delivery time</Label>
                  <Input
                    id="ws-delivery"
                    type="datetime-local"
                    value={c.deliveryAtLocal}
                    onChange={(e) => c.setDeliveryAtLocal(e.target.value)}
                    className="min-h-9"
                  />
                </div>
              </div>
            </fieldset>
          ) : null}

          {walkInSnapshotProfile ? (
            <PartnerCustomerSnapshotCards profile={walkInSnapshotProfile} stats={c.insightStats} />
          ) : null}

          {isDialog && walkInSnapshotProfile && c.walkInProfile?.registered ? (
            <Badge variant="secondary" className="w-fit text-xs">
              Linked to shop customer record
            </Badge>
          ) : null}

          <Button
            type="button"
            className="min-h-10 w-full sm:w-auto"
            onClick={c.goFromCustomer}
            data-testid="create-order-customer-next"
          >
            Continue to items
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        </PartnerOpsSurface>
      ) : null}

      {c.step === 'intake' ? (
        <PartnerOpsSurface className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PartnerOpsSectionLabel>Step 2 — Add items</PartnerOpsSectionLabel>
            <div
              className="flex rounded-lg bg-muted/60 p-0.5"
              role="tablist"
              aria-label="Intake mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={c.intakeMode === 'services'}
                onClick={() => c.switchIntakeMode('services')}
                className={cn(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium',
                  c.intakeMode === 'services'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                By service
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={c.intakeMode === 'garments'}
                disabled={c.fulfillment === 'doorstep'}
                onClick={() => c.switchIntakeMode('garments')}
                className={cn(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium',
                  c.intakeMode === 'garments'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                <Shirt className="h-3.5 w-3.5" aria-hidden />
                By garment
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {c.intakeMode === 'services'
              ? 'Dry clean, wash & fold, and other offerings from your live service catalog.'
              : 'Shirt, pant, saree — one tag per piece when you print with “1 tag per piece”.'}
          </p>

          {c.intakeMode === 'services' ? (
            <>
              {c.servicesQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading services…</p>
              ) : c.services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm">
                  <p className="font-medium">No active services</p>
                  <p className="mt-1 text-muted-foreground">
                    Add wash, dry clean, and iron packages in your catalog first.
                  </p>
                  <Button type="button" size="sm" className="mt-3" variant="secondary" asChild>
                    <Link href="/partner/orders?workspace=services">Manage services</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {c.services.map((svc) => (
                    <PartnerServiceTile
                      key={svc.id}
                      service={svc}
                      onAdd={() => {
                        setDialogService(svc);
                        setDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
              {c.lineRows.length > 0 ? (
                <div className="overflow-hidden rounded-3xl border border-border">
                  <PartnerNewOrderLineItemsTable
                    rows={c.lineRows}
                    onSetQty={c.setLineQty}
                    onRemove={c.removeLine}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <>
              {c.loadingGarments ? (
                <p className="text-sm text-muted-foreground">Loading garment prices…</p>
              ) : c.garmentTiles.length === 0 ? (
                <PartnerGarmentIntakeEmpty
                  onAddGarments={() => setGarmentOfferOpen(true)}
                  onApplySuggested={() => applySuggestedM.mutate()}
                  applyPending={applySuggestedM.isPending}
                />
              ) : (
                <>
                  <ClothWallCategoryChips value={c.category} onChange={c.setCategory} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {c.visibleGarmentTiles.map((tile) => (
                      <ClothWallTileButton
                        key={tile.id}
                        tile={tile}
                        quantity={c.qtyForTile(tile)}
                        process={c.processForTile(tile)}
                        onIncrement={() => c.bumpTile(tile, 1)}
                        onDecrement={() => c.bumpTile(tile, -1)}
                        onProcessChange={(p) => c.changeProcess(tile, p)}
                      />
                    ))}
                    <PartnerGarmentAddTile onClick={() => setGarmentOfferOpen(true)} />
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => c.setStep('customer')}>
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
              Back
            </Button>
            <Button
              type="button"
              onClick={c.goFromIntake}
              disabled={
                c.intakeMode === 'services' ? c.serviceItems.length === 0 : c.garmentLines.length === 0
              }
              data-testid="create-order-intake-next"
            >
              Review order
            </Button>
          </div>
        </PartnerOpsSurface>
      ) : null}

      {c.step === 'review' ? (
        <div className="grid gap-5 lg:grid-cols-[1.55fr_0.95fr]">
          <PartnerOpsSurface className="space-y-5">
            <PartnerOpsSectionLabel>Step 3 — Review &amp; save</PartnerOpsSectionLabel>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/40 p-4 text-sm">
                <p className="font-semibold">{c.customerName.trim()}</p>
                <p className="text-muted-foreground">{c.customerPhone}</p>
                <p className="mt-1 capitalize text-muted-foreground">
                  {c.customerGender === 'male' ? 'Male (M on tag)' : 'Female (F on tag)'}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                  Mix-up safety
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Color token + day number assigned when you save</li>
                  <li>Print bag tag + per-piece tags before processing</li>
                  <li>Match phone last 4 on tag to customer phone</li>
                </ul>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border">
              <PartnerNewOrderLineItemsTable
                rows={c.lineRows}
                onSetQty={c.setLineQty}
                onRemove={c.removeLine}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-notes">Special instructions (optional)</Label>
              <Textarea
                id="ws-notes"
                value={c.notes}
                onChange={(e) => c.setNotes(e.target.value)}
                rows={2}
                placeholder="Stain on collar, handle with care, etc."
              />
            </div>

            {isDialog ? (
              <div className="space-y-3 rounded-2xl border border-border/60 p-3">
                <p className="text-sm font-medium">Order options</p>
                {activeCoupons.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="ws-coupon-pick">Shop coupon</Label>
                    <Select
                      id="ws-coupon-pick"
                      value={c.couponCode}
                      onChange={(e) => {
                        c.setCouponCode(e.target.value);
                        c.setCouponApplied(false);
                        c.setCouponDiscountInr(0);
                      }}
                      className="min-h-9"
                    >
                      <option value="">Select coupon…</option>
                      {activeCoupons.map((coupon) => (
                        <option key={coupon.id} value={coupon.code}>
                          {coupon.code} ({coupon.discount_percent}% off)
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={c.expressOrder}
                    onChange={(e) => c.setExpressOrder(e.target.checked)}
                  />
                  Express service
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={c.gstInvoiceRequested}
                    onChange={(e) => c.setGstInvoiceRequested(e.target.checked)}
                  />
                  GST invoice requested (B2B)
                </label>
                <div className="space-y-1.5">
                  <Label htmlFor="ws-staff-note">Internal staff note</Label>
                  <Textarea
                    id="ws-staff-note"
                    value={c.staffNote}
                    onChange={(e) => c.setStaffNote(e.target.value)}
                    rows={2}
                    placeholder="Not shown on customer tag"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => c.setStep('intake')}>
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                Edit items
              </Button>
            </div>
          </PartnerOpsSurface>

          <div className={cn('space-y-4', isDialog && 'lg:sticky lg:top-0')}>
            <PartnerOrderCheckoutAside
              totals={c.checkoutTotals}
              couponCode={c.couponCode}
              onCouponCodeChange={c.setCouponCode}
              couponApplied={c.couponApplied}
              onToggleCoupon={() => {
                c.setCouponApplied(false);
                c.setCouponDiscountInr(0);
              }}
              onApplyCoupon={c.applyCoupon}
              applyCouponPending={c.applyCouponPending}
              couponError={c.couponError}
              deliveryType={c.deliveryType}
              onDeliveryTypeChange={c.setDeliveryType}
              deliveryDate={c.preferredDeliveryDate}
              onDeliveryDateChange={c.setPreferredDeliveryDate}
              paymentMethod={c.paymentMethod}
              onPaymentMethodChange={c.setPaymentMethod}
              notes={c.notes}
              onNotesChange={c.setNotes}
              submitPending={c.createMutation.isPending || c.createDoorstepMutation.isPending}
              submitDisabled={c.lineRows.length === 0}
              submitLabel={
                c.fulfillment === 'doorstep'
                  ? 'Create doorstep order'
                  : 'Save order & open print tags'
              }
              onSubmit={c.submitOrder}
              hideSubmitButton={isDialog}
              className={isDialog ? 'lg:max-h-none' : undefined}
            />
            {c.fulfillment === 'walk_in' ? <PartnerNewOrderPrintHintCard /> : null}
          </div>
        </div>
      ) : null}

      <PartnerGarmentOfferDialog
        open={garmentOfferOpen}
        onOpenChange={setGarmentOfferOpen}
        onSaved={() => void qc.invalidateQueries({ queryKey: queryKeys.partnerPriceList() })}
      />
    </div>
  );
}
