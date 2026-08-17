'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Shirt, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { WASHHOUSE_CATALOG_PHOTOS } from '@/features/marketing/catalog/washhouse-catalog-photos';
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
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';
import {
  formatPhoneInputDisplay,
  getPartnerPhoneFieldError,
  isPartnerPhoneReady,
  PARTNER_PHONE_INLINE_ERROR,
  partnerPhoneDisplayValue,
  partnerPhoneToE164,
} from '@/features/partner/lib/partner-phone-schema';
import { searchPartnerCustomers } from '@/features/partner/customer-desk/api';
import type { CustomerDeskProfile } from '@/features/partner/customer-desk/types';
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
  const weightCardOptions = [
    {
      id: 'wash-fold',
      label: 'Wash & Fold',
      image: WASHHOUSE_CATALOG_PHOTOS.wash_fold.src,
      alt: WASHHOUSE_CATALOG_PHOTOS.wash_fold.alt,
      match: (name: string) =>
        name.includes('wash & fold') ||
        name.includes('wash and fold') ||
        name.includes('wash fold'),
    },
    {
      id: 'wash-iron',
      label: 'Wash & Iron',
      image: WASHHOUSE_CATALOG_PHOTOS.wash_iron.src,
      alt: WASHHOUSE_CATALOG_PHOTOS.wash_iron.alt,
      match: (name: string) =>
        name.includes('wash & iron') ||
        name.includes('wash and iron') ||
        name.includes('wash iron'),
    },
  ] as const;

  const weightCards = weightCardOptions
    .map((option) => {
      const service = (c.services ?? []).find((svc) => option.match((svc.name ?? '').toLowerCase()));
      return {
        ...option,
        serviceId: service?.id ?? option.id,
        serviceName: service?.name ?? option.label,
        priceInr: Number(service?.price_inr ?? 0),
      };
    })
    .filter((item) => item.serviceName.length > 0);

  const renderPostCreatePanels = showPostCreatePanels || !embedded;
  const isDialog = presentation === 'dialog';

  const [dialogService, setDialogService] = useState<ServiceCatalogItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [garmentOfferOpen, setGarmentOfferOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerDeskProfile[]>([]);
  const [customerSelectionLocked, setCustomerSelectionLocked] = useState(false);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<CustomerDeskProfile | null>(null);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    title: 'Ms',
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    state: '',
  });
  const [garmentSearch, setGarmentSearch] = useState('');
  const [garmentPage, setGarmentPage] = useState(1);
  const GARMENT_PAGE_SIZE = 12;
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchRequestRef = useRef(0);
  const qc = useQueryClient();

  const customerPhoneDisplay = partnerPhoneDisplayValue(c.customerPhone);
  const customerPhoneError = getPartnerPhoneFieldError(customerPhoneDisplay);
  const canContinueCustomer =
    Boolean(c.customerName.trim()) && isPartnerPhoneReady(c.customerPhone);
  const newCustomerPhoneError = getPartnerPhoneFieldError(newCustomerForm.phone);
  const canSubmitNewCustomer =
    Boolean(newCustomerForm.name.trim()) && isPartnerPhoneReady(newCustomerForm.phone);

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

  const customerSearchMutation = useMutation({
    mutationFn: (q: string) => searchPartnerCustomers(q.trim()),
    onSuccess: (rows) => {
      const requestId = searchRequestRef.current;
      if (requestId === 0) {
        setCustomerSearchResults(rows);
        return;
      }
      const activeQuery = customerSearchQuery.trim();
      if (activeQuery.length >= 3 && requestId === searchRequestRef.current) {
        setCustomerSearchResults(rows);
      }
    },
    onError: () => toast.error('Customer search failed'),
  });

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setCustomerSearchResults([]);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function runCustomerSearch(value: string) {
    const q = value.trim();
    if (q.length < 3) {
      setCustomerSearchResults([]);
      return;
    }
    searchRequestRef.current += 1;
    customerSearchMutation.mutate(q);
  }

  function selectCustomerSearchResult(profile: CustomerDeskProfile) {
    c.applyCustomerFromSearch(profile);
    setCustomerSearchQuery(profile.name?.trim() || profile.phone);
    setCustomerSearchResults([]);
    setCustomerSelectionLocked(true);
    setSelectedCustomerProfile(profile);
  }

  function resetCustomerSearch() {
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    c.setCustomerName('');
    c.setCustomerPhone('');
    c.setLookupSuppressed(false);
    setCustomerSelectionLocked(false);
    setSelectedCustomerProfile(null);
  }

  function openNewCustomerDialog() {
    setNewCustomerForm((prev) => ({
      ...prev,
      name: c.customerName.trim(),
      phone: customerPhoneDisplay,
    }));
    setNewCustomerOpen(true);
  }

  function submitNewCustomer() {
    const name = newCustomerForm.name.trim();
    const phone = partnerPhoneToE164(newCustomerForm.phone);

    if (!name) {
      toast.error('Enter customer name');
      return;
    }

    if (!isValidIndianMobileE164(phone)) {
      toast.error(PARTNER_PHONE_INLINE_ERROR);
      return;
    }

    c.applyCustomerFromSearch({
      name: `${newCustomerForm.title} ${name}`.trim(),
      phone,
      email: '',
      registered: false,
      user_id: null,
      order_count: 0,
      last_order_at: null,
    });
    c.setAddressLine1(newCustomerForm.addressLine1.trim());
    c.setAddressCity(newCustomerForm.city.trim());
    c.setAddressPincode(newCustomerForm.pincode.trim());
    c.setAddressLine2(newCustomerForm.addressLine2.trim());
    c.setAddressLandmark(newCustomerForm.state.trim());
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setCustomerSelectionLocked(true);
    setSelectedCustomerProfile({
      name: `${newCustomerForm.title} ${name}`.trim(),
      phone,
      email: '',
      registered: false,
      user_id: null,
      order_count: 0,
      last_order_at: null,
    } as CustomerDeskProfile);
    setNewCustomerOpen(false);
    toast.success('New customer added to the order');
  }

  useEffect(() => {
    setGarmentPage(1);
  }, [c.category, c.garmentProcess, garmentSearch]);

  const garmentSelectionTiles = (c.visibleGarmentTiles ?? []).filter((tile) => {
    const hasProcessPrice =
      c.garmentProcess === 'dry_clean' ? tile.dryCleanInr != null : tile.pressInr != null;
    if (!hasProcessPrice) return false;

    const query = garmentSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      tile.hinglish.toLowerCase().includes(query) ||
      tile.english.toLowerCase().includes(query) ||
      tile.name.toLowerCase().includes(query)
    );
  });

  const garmentPageCount = Math.max(1, Math.ceil(garmentSelectionTiles.length / GARMENT_PAGE_SIZE));
  const garmentPageItems = garmentSelectionTiles.slice(
    (garmentPage - 1) * GARMENT_PAGE_SIZE,
    garmentPage * GARMENT_PAGE_SIZE,
  );

  const profileForSnapshot = c.walkInSnapshotProfile
    ? {
        ...c.walkInSnapshotProfile,
        name: c.customerName.trim() || c.walkInSnapshotProfile.name || 'Customer',
      }
    : null;

  if (c.createdDoorstepOrder && !(suppressSuccessScreen && isDialog)) {
    return (
      <div className="space-y-4" id="partner-walk-in-workspace" data-testid="partner-walk-in-workspace">
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
      <div className="space-y-4" id="partner-walk-in-workspace" data-testid="partner-walk-in-workspace">
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
    <div className="space-y-4" id="partner-walk-in-workspace" data-testid="partner-walk-in-workspace">
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
        <PartnerOpsSurface className="space-y-4">
          <PartnerOpsSectionLabel>Step 1 — Customer</PartnerOpsSectionLabel>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[260px]" ref={searchBoxRef}>
                <Input
                  value={customerSearchQuery}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCustomerSearchQuery(next);
                    if (next.trim().length >= 3) {
                      runCustomerSearch(next);
                    } else {
                      setCustomerSearchResults([]);
                    }
                  }}
                  placeholder="Search by name or mobile"
                  className="min-h-9"
                />
                {customerSearchResults.length > 0 ? (
                  <ul className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-background p-1 shadow-sm">
                    {customerSearchResults.map((row) => (
                      <li key={`${row.phone}-${row.user_id ?? 'guest'}`}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/70"
                          onClick={() => selectCustomerSearchResult(row)}
                        >
                          <span className="font-medium">{row.name || row.phone}</span>
                          <span className="text-muted-foreground">{row.phone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <Button type="button" size="sm" onClick={openNewCustomerDialog}>
                + Add new customer
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ws-phone">Phone (WhatsApp)</Label>
                <Input
                  id="ws-phone"
                  type="tel"
                  inputMode="tel"
                  value={customerPhoneDisplay}
                  onChange={(e) => c.setCustomerPhone(formatPhoneInputDisplay(e.target.value))}
                  required
                  readOnly={customerSelectionLocked}
                  className={cn('min-h-9', customerSelectionLocked && 'bg-muted/60')}
                  data-testid="create-order-phone"
                  aria-invalid={Boolean(customerPhoneError)}
                  aria-describedby={
                    customerPhoneError
                      ? 'ws-phone-error'
                      : isDialog && c.walkInLookupPhone
                        ? 'ws-phone-lookup-hint'
                        : undefined
                  }
                />
                {customerPhoneError ? (
                  <p id="ws-phone-error" className="text-xs text-danger" role="alert">
                    {customerPhoneError}
                  </p>
                ) : null}
                {isDialog && c.walkInLookupPhone ? (
                  <p id="ws-phone-lookup-hint" className="text-xs text-muted-foreground">
                    {c.walkInLookupQ.isFetching ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                        Looking up customer…
                      </span>
                    ) : c.walkInProfile?.registered ? (
                      'Existing customer — order will link to this phone.'
                    ) : null}
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
                  readOnly={customerSelectionLocked}
                  className={cn('min-h-9', customerSelectionLocked && 'bg-muted/60')}
                  data-testid="create-order-name"
                />
              </div>
            </div>
          </div>

          {profileForSnapshot ? (
            <PartnerCustomerSnapshotCards profile={profileForSnapshot} stats={c.insightStats} />
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

          {isDialog && profileForSnapshot && c.walkInProfile?.registered ? (
            <Badge variant="secondary" className="w-fit text-xs">
              Linked to shop customer record
            </Badge>
          ) : null}

          {/* <Button
            type="button"
            className="h-9 min-h-9 w-full sm:w-auto"
            onClick={c.goFromCustomer}
            disabled={!canContinueCustomer}
            data-testid="create-order-customer-next"
          >
            Continue to items
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Button> */}
        </PartnerOpsSurface>
      ) : null}

      {c.step === 'intake' ? (
        <PartnerOpsSurface className="space-y-4">
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
                By Weight (Kg)
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
                Dryclean and Steam Press (per piece)
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {c.intakeMode === 'services'
              ? 'Dry clean, wash & fold, and other offerings from your live service catalog.'
              : 'Search, filter, and add garments by dry clean or press — quantities stay in the order even if you switch back to weight.'}
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
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {weightCards.map((card) => {
                      const selectedQty = c.serviceItems.find((item) => item.service_id === card.serviceId)?.quantity ?? 0;
                      const displayQty = selectedQty > 0 ? String(selectedQty) : '';

                      return (
                        <div
                          key={card.id}
                          className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
                        >
                          <div className="relative h-32 w-full overflow-hidden bg-muted">
                            <img
                              src={card.image}
                              alt={card.alt}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="space-y-3 p-4">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{card.label}</p>
                                <p className="text-[11px] text-muted-foreground">{card.serviceName}</p>
                              </div>
                              {selectedQty > 0 ? (
                                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                                  {selectedQty} kg
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 w-9 p-0"
                                onClick={() => {
                                  const nextQty = Math.max(0, Number((selectedQty - 0.5).toFixed(2)));
                                  if (nextQty <= 0) {
                                    c.removeServiceLine(card.serviceId);
                                    return;
                                  }
                                  c.setServiceQty(card.serviceId, nextQty);
                                }}
                              >
                                −
                              </Button>
                              <Input
                                type="number"
                                min={0.01}
                                step="0.01"
                                inputMode="decimal"
                                value={displayQty}
                                placeholder="0.0"
                                data-testid={`create-order-weight-qty-${card.id}`}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw.trim() === '') {
                                    c.removeServiceLine(card.serviceId);
                                    return;
                                  }
                                  const value = Number(raw);
                                  if (!Number.isFinite(value) || value < 0.01) {
                                    c.removeServiceLine(card.serviceId);
                                    return;
                                  }
                                  c.setServiceQty(card.serviceId, value);
                                }}
                                className="h-9 flex-1 text-center"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 w-9 p-0"
                                onClick={() => {
                                  const nextQty = Number((selectedQty + 0.5).toFixed(2));
                                  c.setServiceQty(card.serviceId, nextQty);
                                }}
                              >
                                +
                              </Button>
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
                              <span className="font-medium">{formatInr(card.priceInr)}</span>
                              <span className="text-muted-foreground">/ kg</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-3">
                    <p className="text-sm text-muted-foreground">
                      Need pieces too? Add garments from your catalog and pricing list.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setGarmentOfferOpen(true)}>
                      + Add garments
                    </Button>
                  </div>

                  {/* {c.lineRows.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {c.lineRows.map((row) => (
                        <div
                          key={row.service_id}
                          className="rounded-2xl border border-border bg-background p-3 shadow-sm"
                        >
                          <p className="text-sm font-semibold">{row.name}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {row.quantity} {row.quantity > 1 ? 'items' : 'item'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {Number.isInteger(row.quantity)
                              ? `${row.quantity} items`
                              : `${row.quantity} kg`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null} */}
                </>
              )}
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
                  <div className="flex flex-wrap items-center gap-2">
                    {(['dry_clean', 'press'] as const).map((process) => (
                      <button
                        key={process}
                        type="button"
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          c.garmentProcess === process
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:bg-muted',
                        )}
                        onClick={() => c.setGarmentProcess(process)}
                      >
                        {process === 'dry_clean' ? 'Dryclean' : 'Press'}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Input
                      value={garmentSearch}
                      onChange={(e) => setGarmentSearch(e.target.value)}
                      placeholder="Search garments..."
                      className="min-h-9 sm:max-w-xs"
                    />
                    <div className="text-xs text-muted-foreground">
                      {garmentSelectionTiles.length} items
                    </div>
                  </div>

                  <ClothWallCategoryChips value={c.category} onChange={c.setCategory} />

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {garmentPageItems.map((tile) => (
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

                  {garmentSelectionTiles.length > GARMENT_PAGE_SIZE ? (
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={garmentPage === 1}
                        onClick={() => setGarmentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {garmentPage} of {garmentPageCount}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={garmentPage >= garmentPageCount}
                        onClick={() => setGarmentPage((p) => Math.min(garmentPageCount, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => c.setStep('customer')}>
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
              Back
            </Button>
            {/* <Button
              type="button"
              onClick={c.goFromIntake}
              disabled={
                c.intakeMode === 'services' ? c.serviceItems.length === 0 : c.garmentLines.length === 0
              }
              data-testid="create-order-intake-next"
            >
              Review order
            </Button> */}
          </div>
        </PartnerOpsSurface>
      ) : null}

      {c.step === 'review' ? (
        <div className="grid gap-3 lg:grid-cols-[1.55fr_0.95fr]">
          <PartnerOpsSurface className="space-y-4">
            <PartnerOpsSectionLabel>Step 3 — Review &amp; save</PartnerOpsSectionLabel>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/40 p-4 text-sm">
                <p className="font-semibold">{c.customerName.trim()}</p>
                <p className="text-muted-foreground">{c.customerPhone}</p>
              </div>
              {/* <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                  Mix-up safety
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Color token + day number assigned when you save</li>
                  <li>Print bag tag + per-piece tags before processing</li>
                  <li>Match phone last 4 on tag to customer phone</li>
                </ul>
              </div> */}
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <PartnerNewOrderLineItemsTable
                rows={c.lineRows}
                onSetQty={c.setLineQty}
                onSetRate={c.setLineRate}
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
                  Express service (+₹100)
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
              discountType={c.discountType}
              onDiscountTypeChange={c.setDiscountType}
              discountValue={c.discountValue}
              onDiscountValueChange={c.handleDiscountValueChange}
              deliveryType={c.deliveryType}
              onDeliveryTypeChange={c.setDeliveryType}
              deliveryDate={c.preferredDeliveryDate}
              onDeliveryDateChange={c.setPreferredDeliveryDate}
              paymentMethod={c.paymentMethod}
              onPaymentMethodChange={c.setPaymentMethod}
              notes={c.notes}
              onNotesChange={c.setNotes}
              pickupCharge={c.pickupChargeOverride}
              onPickupChargeChange={c.setPickupChargeOverride}
              deliveryCharge={c.deliveryChargeOverride}
              onDeliveryChargeChange={c.setDeliveryChargeOverride}
              advancePaid={c.advancePaid}
              onAdvancePaidChange={c.setAdvancePaid}
              expressOrder={c.expressOrder}
              onExpressOrderChange={c.setExpressOrder}
              submitPending={c.createMutation.isPending || c.createDoorstepMutation.isPending}
              submitDisabled={c.lineRows.length === 0}
              submitLabel={
                c.fulfillment === 'doorstep'
                  ? 'Create doorstep order'
                  : 'Create order'
              }
              onSubmit={c.submitOrder}
              hideSubmitButton={isDialog}
              className={isDialog ? 'lg:max-h-none' : undefined}
            />
            {c.fulfillment === 'walk_in' ? <PartnerNewOrderPrintHintCard /> : null}
          </div>
        </div>
      ) : null}

      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add new customer</DialogTitle>
            <DialogDescription>Fill the customer details and add them directly to this order.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-title">Title</Label>
              <Select
                id="new-customer-title"
                value={newCustomerForm.title}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, title: e.target.value }))}
                className="min-h-9"
              >
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
                <option value="Mr">Mr</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-name">Name</Label>
              <Input
                id="new-customer-name"
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-customer-phone">Mobile number</Label>
              <Input
                id="new-customer-phone"
                type="tel"
                inputMode="tel"
                value={newCustomerForm.phone}
                onChange={(e) =>
                  setNewCustomerForm((prev) => ({
                    ...prev,
                    phone: formatPhoneInputDisplay(e.target.value),
                  }))
                }
                placeholder="e.g. 9876543210"
                aria-invalid={Boolean(newCustomerPhoneError)}
                aria-describedby={newCustomerPhoneError ? 'new-customer-phone-error' : undefined}
              />
              {newCustomerPhoneError ? (
                <p id="new-customer-phone-error" className="text-xs text-danger" role="alert">
                  {newCustomerPhoneError}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-customer-address">Address line 1</Label>
              <Input
                id="new-customer-address"
                value={newCustomerForm.addressLine1}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                placeholder="House / flat / building"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-address2">Address line 2</Label>
              <Input
                id="new-customer-address2"
                value={newCustomerForm.addressLine2}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
                placeholder="Area / landmark"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-city">City</Label>
              <Input
                id="new-customer-city"
                value={newCustomerForm.city}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-pincode">Pincode</Label>
              <Input
                id="new-customer-pincode"
                value={newCustomerForm.pincode}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, pincode: e.target.value }))}
                placeholder="Pincode"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-state">State</Label>
              <Input
                id="new-customer-state"
                value={newCustomerForm.state}
                onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setNewCustomerOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitNewCustomer} disabled={!canSubmitNewCustomer}>
              Add customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PartnerGarmentOfferDialog
        open={garmentOfferOpen}
        onOpenChange={setGarmentOfferOpen}
        onSaved={() => void qc.invalidateQueries({ queryKey: queryKeys.partnerPriceList() })}
      />
    </div>
  );
}
