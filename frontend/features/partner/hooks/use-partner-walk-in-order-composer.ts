'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getPartnerPriceList } from '@/features/partner-price-list/api/partner-price-list';
import {
  buildCatalogClothWallTiles,
  buildServiceClothWallTiles,
  filterTilesByCategory,
  type ClothWallCategoryChip,
  type ClothWallTile,
  unitPriceForTile,
} from '@/features/partner-shop-floor/lib/cloth-wall-items';
import {
  catalogLineKey,
  clothWallPieceCount,
  clothWallSubtotalInr,
  decrementClothWallQty,
  incrementClothWallQty,
  serviceLineKey,
  type ClothWallLine,
  type ClothWallProcess,
} from '@/features/partner-shop-floor/lib/cloth-wall-qty';
import type { PartnerNewOrderLineRow } from '@/features/partner/components/ops-visual/partner-new-order-line-items-table';
import {
  computePartnerCheckoutTotals,
  type PartnerDeliveryType,
} from '@/features/partner/components/ops-visual/partner-order-checkout-aside';
import { createPartnerAssistedOrder } from '@/features/partner/customer-desk/api';
import {
  usePartnerCustomerDeskLookup,
  usePartnerCustomerInsightRow,
} from '@/features/partner/customer-desk/hooks';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';
import type { AssistedOrderCreateResult } from '@/features/partner/customer-desk/types';
import { guestDeskProfile } from '@/features/partner/customer-desk/types';
import type { PartnerCustomerGender } from '@/features/partner/components/partner-customer-gender-field';
import { usePartnerAnalytics, usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerServices } from '@/services/partner-service-catalog';
import { validatePartnerCoupon } from '@/services/partner-coupons';
import {
  advanceWalkInOrderStatus,
  createWalkInOrder,
  type WalkInOrder,
  type WalkInOrderLineItem,
} from '@/services/partner-walk-in-orders';

export type WalkInComposerStep = 'customer' | 'intake' | 'review';
export type WalkInComposerIntakeMode = 'services' | 'garments';
export type WalkInComposerFulfillment = 'walk_in' | 'doorstep';

type ServiceLine = { service_id: string; quantity: number };

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDoorstepSlots() {
  const pickup = new Date();
  pickup.setHours(pickup.getHours() + 2, 0, 0, 0);
  const delivery = new Date(pickup);
  delivery.setDate(delivery.getDate() + 1);
  delivery.setHours(18, 0, 0, 0);
  return {
    pickup_at: toDatetimeLocalValue(pickup),
    delivery_at: toDatetimeLocalValue(delivery),
  };
}

export type UsePartnerWalkInOrderComposerOptions = {
  initialName?: string;
  initialPhone?: string;
  initialFulfillment?: WalkInComposerFulfillment;
  /** When false, skip all phone lookups. */
  lookupActive?: boolean;
  /** Wizard mode: lookup only on customer step. Dashboard: false. */
  lookupOnlyOnCustomerStep?: boolean;
};

function invalidatePartnerOrderQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.partnerWalkInOrders() });
  void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDashboard() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomerInsightsDashboard() });
}

export function usePartnerWalkInOrderComposer(options: UsePartnerWalkInOrderComposerOptions = {}) {
  const {
    initialName = '',
    initialPhone = '',
    initialFulfillment = 'walk_in',
    lookupActive = true,
    lookupOnlyOnCustomerStep = true,
  } = options;
  const enabled = usePartnerQueriesEnabled();
  const queryClient = useQueryClient();
  const analyticsQ = usePartnerAnalytics();
  const laundryId = analyticsQ.data?.laundry_id ?? '';
  const doorstepSlots = defaultDoorstepSlots();

  const [fulfillment, setFulfillment] = useState<WalkInComposerFulfillment>(initialFulfillment);
  const [step, setStep] = useState<WalkInComposerStep>('customer');
  const [intakeMode, setIntakeMode] = useState<WalkInComposerIntakeMode>('services');
  const [customerName, setCustomerName] = useState(initialName);
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [customerGender, setCustomerGender] = useState<PartnerCustomerGender | null>(null);
  const [notes, setNotes] = useState('');
  const [expectedReadyAt, setExpectedReadyAt] = useState('');
  const [serviceItems, setServiceItems] = useState<ServiceLine[]>([]);
  const [garmentLines, setGarmentLines] = useState<ClothWallLine[]>([]);
  const [tileProcess, setTileProcess] = useState<Record<string, ClothWallProcess>>({});
  const [category, setCategory] = useState<ClothWallCategoryChip | 'all'>('all');
  const [createdOrder, setCreatedOrder] = useState<WalkInOrder | null>(null);
  const [createdDoorstepOrder, setCreatedDoorstepOrder] = useState<AssistedOrderCreateResult | null>(
    null,
  );
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressPincode, setAddressPincode] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [pickupAtLocal, setPickupAtLocal] = useState(doorstepSlots.pickup_at);
  const [deliveryAtLocal, setDeliveryAtLocal] = useState(doorstepSlots.delivery_at);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscountInr, setCouponDiscountInr] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [deliveryType, setDeliveryType] = useState<PartnerDeliveryType>('Both');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const servicesQ = useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listPartnerServices,
    enabled,
  });

  const priceListQ = useQuery({
    queryKey: queryKeys.partnerPriceList(),
    queryFn: () => getPartnerPriceList(),
    enabled,
  });

  const services = useMemo(
    () =>
      (servicesQ.data ?? []).filter(
        (s) => s.is_active && (s.catalog_status ?? 'active') === 'active',
      ),
    [servicesQ.data],
  );

  const catalogTiles = useMemo(
    () => buildCatalogClothWallTiles(priceListQ.data?.items ?? []),
    [priceListQ.data?.items],
  );
  const serviceTiles = useMemo(
    () => buildServiceClothWallTiles(servicesQ.data ?? []),
    [servicesQ.data],
  );
  const usingCatalog = catalogTiles.length > 0;
  const garmentTiles = usingCatalog ? catalogTiles : serviceTiles;
  const visibleGarmentTiles = filterTilesByCategory(garmentTiles, category);

  const walkInLookupPhone = useMemo(() => {
    const normalized = normalizeIndianPhoneInput(customerPhone);
    return isValidIndianMobileE164(normalized) ? normalized : null;
  }, [customerPhone]);

  const walkInLookupQ = usePartnerCustomerDeskLookup(
    walkInLookupPhone ? { phone: walkInLookupPhone } : null,
    Boolean(
      lookupActive &&
        walkInLookupPhone &&
        !createdOrder &&
        !createdDoorstepOrder &&
        (!lookupOnlyOnCustomerStep || step === 'customer'),
    ),
  );

  const walkInProfile =
    walkInLookupQ.data ?? (walkInLookupPhone ? guestDeskProfile(walkInLookupPhone) : null);

  const walkInSnapshotProfile =
    customerName.trim() && walkInLookupPhone && walkInProfile ? walkInProfile : null;

  const walkInInsightQ = usePartnerCustomerInsightRow(
    walkInSnapshotProfile,
    Boolean(walkInSnapshotProfile),
  );

  const createMutation = useMutation({
    mutationFn: createWalkInOrder,
    onSuccess: (order) => {
      toast.success(`Order #${order.tracking_code} saved — print tags now.`);
      invalidatePartnerOrderQueries(queryClient);
      setCreatedOrder(order);
    },
    onError: () => toast.error('Could not save order'),
  });

  const createDoorstepMutation = useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: Parameters<typeof createPartnerAssistedOrder>[0];
      idempotencyKey: string;
    }) => createPartnerAssistedOrder(payload, idempotencyKey),
    onSuccess: (result) => {
      toast.success(`Doorstep order #${result.tracking_code} created.`);
      invalidatePartnerOrderQueries(queryClient);
      setCreatedDoorstepOrder(result);
    },
    onError: () => toast.error('Could not create doorstep order'),
  });

  const startWashMutation = useMutation({
    mutationFn: (orderId: string) => advanceWalkInOrderStatus(orderId, 'washing'),
    onSuccess: () => {
      toast.success('Wash started');
      if (createdOrder) {
        setCreatedOrder({ ...createdOrder, status: 'washing' });
      }
      void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
    },
    onError: () => toast.error('Could not start wash'),
  });

  function addServiceWithQty(serviceId: string, quantity: number) {
    setServiceItems((prev) => {
      const existing = prev.find((i) => i.service_id === serviceId);
      if (existing) {
        return prev.map((i) =>
          i.service_id === serviceId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { service_id: serviceId, quantity }];
    });
  }

  function addCatalogLines(lines: ClothWallLine[]) {
    if (lines.length === 0) return;
    setIntakeMode('garments');
    setServiceItems([]);
    setGarmentLines((prev) => {
      let next = [...prev];
      for (const line of lines) {
        const existing = next.find((l) => l.key === line.key);
        if (existing) {
          next = next.map((l) =>
            l.key === line.key ? { ...l, quantity: l.quantity + line.quantity } : l,
          );
        } else {
          next.push(line);
        }
      }
      return next;
    });
  }

  function setServiceQty(serviceId: string, quantity: number) {
    if (quantity < 1) {
      setServiceItems((prev) => prev.filter((i) => i.service_id !== serviceId));
      return;
    }
    setServiceItems((prev) =>
      prev.map((i) => (i.service_id === serviceId ? { ...i, quantity } : i)),
    );
  }

  function removeServiceLine(serviceId: string) {
    setServiceItems((prev) => prev.filter((i) => i.service_id !== serviceId));
  }

  function setLineQty(lineKey: string, quantity: number) {
    if (intakeMode === 'services') {
      setServiceQty(lineKey, quantity);
      return;
    }
    if (quantity < 1) {
      setGarmentLines((prev) => prev.filter((l) => l.key !== lineKey));
      return;
    }
    setGarmentLines((prev) =>
      prev.map((l) => (l.key === lineKey ? { ...l, quantity } : l)),
    );
  }

  function removeLine(lineKey: string) {
    if (intakeMode === 'services') {
      removeServiceLine(lineKey);
      return;
    }
    setGarmentLines((prev) => prev.filter((l) => l.key !== lineKey));
  }

  function processForTile(tile: ClothWallTile): ClothWallProcess {
    return tileProcess[tile.id] ?? tile.defaultProcess;
  }

  function qtyForTile(tile: ClothWallTile): number {
    const process = processForTile(tile);
    const key =
      tile.source === 'catalog' && tile.catalogItemId
        ? catalogLineKey(tile.catalogItemId, process)
        : serviceLineKey(tile.serviceId ?? tile.id);
    return garmentLines.find((l) => l.key === key)?.quantity ?? 0;
  }

  function bumpTile(tile: ClothWallTile, delta: 1 | -1) {
    const process = processForTile(tile);
    const key =
      tile.source === 'catalog' && tile.catalogItemId
        ? catalogLineKey(tile.catalogItemId, process)
        : serviceLineKey(tile.serviceId ?? tile.id);
    if (delta < 0) {
      setGarmentLines((prev) => decrementClothWallQty(prev, key));
      return;
    }
    const price = unitPriceForTile(tile, process);
    setGarmentLines((prev) =>
      incrementClothWallQty(prev, {
        key,
        unitPriceInr: price,
        label: tile.hinglish,
        catalogItemId: tile.catalogItemId,
        serviceId: tile.serviceId,
        process: tile.source === 'catalog' ? process : undefined,
      }),
    );
  }

  function changeProcess(tile: ClothWallTile, process: ClothWallProcess) {
    const prevProcess = processForTile(tile);
    setTileProcess((p) => ({ ...p, [tile.id]: process }));
    if (!tile.catalogItemId || prevProcess === process) return;
    const oldKey = catalogLineKey(tile.catalogItemId, prevProcess);
    const qty = garmentLines.find((l) => l.key === oldKey)?.quantity ?? 0;
    if (qty < 1) return;
    const newKey = catalogLineKey(tile.catalogItemId, process);
    const price = unitPriceForTile(tile, process);
    setGarmentLines((prev) => {
      const without = prev.filter((l) => l.key !== oldKey && l.key !== newKey);
      return [
        ...without,
        {
          key: newKey,
          quantity: qty,
          unitPriceInr: price,
          label: tile.hinglish,
          catalogItemId: tile.catalogItemId,
          process,
        },
      ];
    });
  }

  const lineRows: PartnerNewOrderLineRow[] = useMemo(() => {
    if (intakeMode === 'services') {
      return serviceItems.map((item) => {
        const svc = services.find((s) => s.id === item.service_id);
        const rate = Number(svc?.price_inr ?? 0);
        return {
          ...item,
          name: svc?.name ?? 'Service',
          rate,
          amount: rate * item.quantity,
        };
      });
    }
    return garmentLines.map((line) => ({
      service_id: line.key,
      quantity: line.quantity,
      name: line.label,
      rate: line.unitPriceInr,
      amount: line.unitPriceInr * line.quantity,
    }));
  }, [garmentLines, intakeMode, serviceItems, services]);

  const estimatedSubtotal =
    intakeMode === 'services'
      ? lineRows.reduce((sum, row) => sum + row.amount, 0)
      : clothWallSubtotalInr(garmentLines);

  const pieceCount =
    intakeMode === 'services'
      ? lineRows.reduce((s, r) => s + r.quantity, 0)
      : clothWallPieceCount(garmentLines);

  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => validatePartnerCoupon(code),
    onSuccess: (result, _code) => {
      const subtotal =
        intakeMode === 'services'
          ? lineRows.reduce((sum, row) => sum + row.amount, 0)
          : clothWallSubtotalInr(garmentLines);
      const discount = Math.round((subtotal * Number(result.discount_percent)) / 100);
      setCouponDiscountInr(discount);
      setCouponApplied(true);
      setCouponError(null);
      toast.success(`Coupon ${result.code} applied`);
    },
    onError: () => {
      setCouponApplied(false);
      setCouponDiscountInr(0);
      setCouponError('Invalid or inactive coupon');
    },
  });

  function applyCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    setCouponError(null);
    applyCouponMutation.mutate(code);
  }

  function validateCustomer(): boolean {
    const phone = normalizeIndianPhoneInput(customerPhone);
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return false;
    }
    if (!isValidIndianMobileE164(phone)) {
      toast.error('Enter a valid Indian mobile (+91)');
      return false;
    }
    if (!customerGender) {
      toast.error('Select Male or Female — tags use this to avoid mix-ups');
      return false;
    }
    if (fulfillment === 'doorstep') {
      if (!addressLine1.trim()) {
        toast.error('Pickup address line is required for doorstep orders');
        return false;
      }
      if (!addressCity.trim()) {
        toast.error('City is required');
        return false;
      }
      if (!/^\d{6}$/.test(addressPincode.trim())) {
        toast.error('Enter a valid 6-digit pincode');
        return false;
      }
      const pickup = new Date(pickupAtLocal);
      const delivery = new Date(deliveryAtLocal);
      if (Number.isNaN(pickup.getTime()) || Number.isNaN(delivery.getTime())) {
        toast.error('Set valid pickup and delivery times');
        return false;
      }
      if (delivery <= pickup) {
        toast.error('Delivery must be after pickup');
        return false;
      }
    }
    setCustomerPhone(phone);
    return true;
  }

  function switchFulfillment(next: WalkInComposerFulfillment) {
    if (next === fulfillment) return;
    setFulfillment(next);
    if (next === 'doorstep') {
      setIntakeMode('services');
      if (garmentLines.length) {
        setGarmentLines([]);
        toast.message('Doorstep orders use services from your catalog.');
      }
    }
  }

  function goFromCustomer() {
    if (!validateCustomer()) return;
    setStep('intake');
  }

  function goFromIntake() {
    if (fulfillment === 'doorstep' && intakeMode === 'garments') {
      toast.error('Doorstep orders use services — switch to By service');
      return;
    }
    if (intakeMode === 'services' && serviceItems.length === 0) {
      toast.error('Add at least one service');
      return;
    }
    if (intakeMode === 'garments' && garmentLines.length === 0) {
      toast.error('Add at least one garment');
      return;
    }
    setStep('review');
  }

  function buildWalkInItems(): WalkInOrderLineItem[] {
    if (intakeMode === 'services') {
      return serviceItems.map((item) => ({
        service_id: item.service_id,
        quantity: item.quantity,
      }));
    }
    return garmentLines.map((line) => {
      if (line.catalogItemId) {
        return {
          catalog_item_id: line.catalogItemId,
          process: line.process,
          quantity: line.quantity,
        };
      }
      return {
        service_id: line.serviceId!,
        quantity: line.quantity,
      };
    });
  }

  function validateForSubmit(): boolean {
    if (!validateCustomer()) return false;
    if (lineRows.length === 0) {
      toast.error('Add at least one line item');
      return false;
    }
    return true;
  }

  function submitOrder() {
    if (createdOrder || createdDoorstepOrder || createMutation.isPending || createDoorstepMutation.isPending) {
      return;
    }
    if (!validateForSubmit()) return;
    const phone = normalizeIndianPhoneInput(customerPhone);
    const e164 = phone.startsWith('+') ? phone : `+${phone}`;

    if (fulfillment === 'doorstep') {
      if (!laundryId) {
        toast.error('Shop profile still loading — try again');
        return;
      }
      if (intakeMode !== 'services' || serviceItems.length === 0) {
        toast.error('Add at least one service for doorstep orders');
        return;
      }
      const payload = {
        phone: e164,
        customer_name: customerName.trim(),
        laundry_id: laundryId,
        address: {
          line1: addressLine1.trim(),
          line2: addressLine2.trim() || undefined,
          city: addressCity.trim(),
          pincode: addressPincode.trim(),
          landmark: addressLandmark.trim() || undefined,
        },
        pickup_at: new Date(pickupAtLocal).toISOString(),
        delivery_at: new Date(deliveryAtLocal).toISOString(),
        items: serviceItems.map((i) => ({ service_id: i.service_id, quantity: i.quantity })),
        notes: notes.trim() || undefined,
        payment_method: 'cod' as const,
        save_address_to_user: false,
        coupon_code: couponApplied && couponCode.trim() ? couponCode.trim() : undefined,
      };
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `hub-create-${Date.now()}`;
      createDoorstepMutation.mutate({ payload, idempotencyKey });
      return;
    }

    createMutation.mutate({
      customer_name: customerName.trim(),
      customer_phone: e164,
      customer_gender: customerGender ?? undefined,
      items: buildWalkInItems(),
      notes: notes.trim() || undefined,
      expected_ready_at: expectedReadyAt ? `${expectedReadyAt}T12:00:00.000Z` : undefined,
      coupon_code: couponApplied && couponCode.trim() ? couponCode.trim() : undefined,
    });
  }

  function resetWorkspace() {
    setCreatedOrder(null);
    setCreatedDoorstepOrder(null);
    setStep('customer');
    setServiceItems([]);
    setGarmentLines([]);
    setNotes('');
    setExpectedReadyAt('');
    setCustomerGender(null);
    setCouponCode('');
    setCouponApplied(false);
    setCouponDiscountInr(0);
    const slots = defaultDoorstepSlots();
    setPickupAtLocal(slots.pickup_at);
    setDeliveryAtLocal(slots.delivery_at);
  }

  const checkoutTotals = useMemo(
    () =>
      computePartnerCheckoutTotals({
        subtotal: estimatedSubtotal,
        couponApplied,
        couponDiscountInr,
        deliveryType,
        lineCount: lineRows.length,
        itemQty: pieceCount,
      }),
    [
      couponApplied,
      couponDiscountInr,
      deliveryType,
      estimatedSubtotal,
      lineRows.length,
      pieceCount,
    ],
  );

  function toggleCouponApplied() {
    setCouponApplied(false);
    setCouponDiscountInr(0);
    setCouponError(null);
  }

  function switchIntakeMode(mode: WalkInComposerIntakeMode) {
    if (mode === intakeMode) return;
    if (serviceItems.length || garmentLines.length) {
      toast.message('Cleared items — pick services or garments for this order, not both.');
      setServiceItems([]);
      setGarmentLines([]);
    }
    setIntakeMode(mode);
  }

  function applyCustomerFromSearch(profile: { name: string; phone: string }) {
    setCustomerName(profile.name);
    setCustomerPhone(normalizeIndianPhoneInput(profile.phone));
  }

  const insightStats = walkInInsightQ.data
    ? {
        lifetime_spend_inr: walkInInsightQ.data.lifetime_spend_inr,
        segment_label: walkInInsightQ.data.segment_label,
      }
    : null;

  const customerPanel = {
    name: createdOrder?.customer_name ?? customerName.trim(),
    phone: createdOrder?.customer_phone ?? customerPhone,
    address: null as string | null,
  };

  return {
    fulfillment,
    switchFulfillment,
    step,
    setStep,
    intakeMode,
    switchIntakeMode,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerGender,
    setCustomerGender,
    notes,
    setNotes,
    expectedReadyAt,
    setExpectedReadyAt,
    serviceItems,
    garmentLines,
    category,
    setCategory,
    createdOrder,
    setCreatedOrder,
    createdDoorstepOrder,
    addressLine1,
    setAddressLine1,
    addressLine2,
    setAddressLine2,
    addressCity,
    setAddressCity,
    addressPincode,
    setAddressPincode,
    addressLandmark,
    setAddressLandmark,
    pickupAtLocal,
    setPickupAtLocal,
    deliveryAtLocal,
    setDeliveryAtLocal,
    couponCode,
    setCouponCode,
    couponApplied,
    setCouponApplied,
    couponDiscountInr,
    setCouponDiscountInr,
    paymentMethod,
    setPaymentMethod,
    deliveryType,
    setDeliveryType,
    preferredDeliveryDate,
    setPreferredDeliveryDate,
    checkoutTotals,
    toggleCouponApplied,
    applyCoupon,
    applyCouponPending: applyCouponMutation.isPending,
    couponError,
    services,
    servicesQ,
    priceListQ,
    garmentTiles,
    visibleGarmentTiles,
    loadingGarments: priceListQ.isLoading || servicesQ.isLoading,
    walkInLookupQ,
    walkInProfile,
    walkInSnapshotProfile,
    walkInInsightQ,
    insightStats,
    lineRows,
    estimatedSubtotal,
    pieceCount,
    addServiceWithQty,
    addCatalogLines,
    setServiceQty,
    removeServiceLine,
    setLineQty,
    removeLine,
    processForTile,
    qtyForTile,
    bumpTile,
    changeProcess,
    goFromCustomer,
    goFromIntake,
    submitOrder,
    validateForSubmit,
    resetWorkspace,
    applyCustomerFromSearch,
    createMutation,
    createDoorstepMutation,
    startWashMutation,
    customerPanel,
  };
}

export type PartnerWalkInOrderComposer = ReturnType<typeof usePartnerWalkInOrderComposer>;
