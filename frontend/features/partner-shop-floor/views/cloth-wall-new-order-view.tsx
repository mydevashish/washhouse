'use client';

import { buildPartnerCreateOrderHref } from '@/features/partner/customer-desk/phone';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, List, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerCustomerGenderField, type PartnerCustomerGender } from '@/features/partner/components/partner-customer-gender-field';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getPartnerPriceList } from '@/features/partner-price-list/api/partner-price-list';
import { ClothWallCategoryChips } from '@/features/partner-shop-floor/components/cloth-wall-category-chips';
import { ClothWallStickyBar } from '@/features/partner-shop-floor/components/cloth-wall-sticky-bar';
import { ClothWallTileButton } from '@/features/partner-shop-floor/components/cloth-wall-tile';
import { FloorCoachMark } from '@/features/partner-shop-floor/components/floor-coach-mark';
import { LazyMount } from '@/features/partner-shop-floor/components/lazy-mount';
import { PhoneNumericKeypad } from '@/features/partner-shop-floor/components/phone-numeric-keypad';
import { WalkInSuccessPanel } from '@/features/partner-shop-floor/components/walk-in-success-panel';
import { recordCoachOrderCreated } from '@/features/partner-shop-floor/lib/floor-coach';
import {
  resolveClothWallTiles,
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
  garmentLineKey,
  incrementClothWallQty,
  serviceLineKey,
  type ClothWallLine,
  type ClothWallProcess,
} from '@/features/partner-shop-floor/lib/cloth-wall-qty';
import { useVisibleGarmentCatalogItems } from '@/features/partner/garment-catalog/hooks/use-visible-garment-catalog-items';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { listPartnerServices } from '@/services/partner-service-catalog';
import {
  advanceWalkInOrderStatus,
  createWalkInOrder,
  type WalkInOrder,
  type WalkInOrderLineItem,
} from '@/services/partner-walk-in-orders';

type WizardStep = 'customer' | 'wall' | 'confirm' | 'success';
type PickerMode = 'wall' | 'list';

type ClothWallNewOrderViewProps = {
  /** When true, hide Advanced assisted tab chrome (floor entry). */
  floorEntry?: boolean;
  title?: string;
  description?: string;
};

export function ClothWallNewOrderView({
  floorEntry = false,
  title = 'New order',
  description = 'Phone → Cloth Wall → Confirm',
}: ClothWallNewOrderViewProps) {
  const enabled = usePartnerQueriesEnabled();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') ?? '';
  const nameParam = searchParams.get('name') ?? '';

  const [step, setStep] = useState<WizardStep>('customer');
  const [pickerMode, setPickerMode] = useState<PickerMode>('wall');
  const [customerName, setCustomerName] = useState(nameParam);
  const [customerPhone, setCustomerPhone] = useState(phoneParam);
  const [customerGender, setCustomerGender] = useState<PartnerCustomerGender | null>(null);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<ClothWallLine[]>([]);
  const [tileProcess, setTileProcess] = useState<Record<string, ClothWallProcess>>({});
  const [category, setCategory] = useState<ClothWallCategoryChip | 'all'>('all');
  const [createdOrder, setCreatedOrder] = useState<WalkInOrder | null>(null);

  useEffect(() => {
    if (nameParam) setCustomerName(nameParam);
    if (phoneParam) setCustomerPhone(phoneParam);
  }, [nameParam, phoneParam]);

  const priceListQ = useQuery({
    queryKey: queryKeys.partnerPriceList(),
    queryFn: () => getPartnerPriceList(),
    enabled,
  });

  const servicesQ = useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listPartnerServices,
    enabled,
  });

  const garmentCatalogQ = useVisibleGarmentCatalogItems();

  const clothWallResolved = useMemo(
    () =>
      resolveClothWallTiles({
        garmentItems: garmentCatalogQ.data ?? [],
        priceListItems: priceListQ.data?.items ?? [],
        services: servicesQ.data ?? [],
      }),
    [garmentCatalogQ.data, priceListQ.data?.items, servicesQ.data],
  );

  const tiles = clothWallResolved.tiles;
  const visibleTiles = filterTilesByCategory(tiles, category);

  const pieceCount = clothWallPieceCount(lines);
  const subtotal = clothWallSubtotalInr(lines);

  const createMutation = useMutation({
    mutationFn: createWalkInOrder,
    onSuccess: (order) => {
      toast.success('Order saved');
      recordCoachOrderCreated();
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerWalkInOrders() });
      void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
      setCreatedOrder(order);
      setStep('success');
    },
    onError: () => toast.error('Could not save order'),
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

  function processForTile(tile: ClothWallTile): ClothWallProcess {
    return tileProcess[tile.id] ?? tile.defaultProcess;
  }

  function lineKeyForTile(tile: ClothWallTile, process: ClothWallProcess): string {
    if (tile.source === 'garment' && tile.garmentItemId) {
      return garmentLineKey(tile.garmentItemId, process);
    }
    if (tile.source === 'catalog' && tile.catalogItemId) {
      return catalogLineKey(tile.catalogItemId, process);
    }
    return serviceLineKey(tile.serviceId ?? tile.id);
  }

  function qtyForTile(tile: ClothWallTile): number {
    const process = processForTile(tile);
    const key = lineKeyForTile(tile, process);
    return lines.find((l) => l.key === key)?.quantity ?? 0;
  }

  function bumpTile(tile: ClothWallTile, delta: 1 | -1) {
    const process = processForTile(tile);
    const key = lineKeyForTile(tile, process);
    if (delta < 0) {
      setLines((prev) => decrementClothWallQty(prev, key));
      return;
    }
    const price = unitPriceForTile(tile, process);
    setLines((prev) =>
      incrementClothWallQty(prev, {
        key,
        unitPriceInr: price,
        label: tile.hinglish,
        catalogItemId: tile.catalogItemId,
        garmentItemId: tile.garmentItemId,
        serviceId: tile.serviceId,
        process:
          tile.source === 'catalog' || tile.source === 'garment' ? process : undefined,
      }),
    );
  }

  function changeProcess(tile: ClothWallTile, process: ClothWallProcess) {
    const prevProcess = processForTile(tile);
    setTileProcess((p) => ({ ...p, [tile.id]: process }));
    const catalogOrGarmentId = tile.catalogItemId ?? tile.garmentItemId;
    if (!catalogOrGarmentId || prevProcess === process) return;
    const oldKey = lineKeyForTile(tile, prevProcess);
    const qty = lines.find((l) => l.key === oldKey)?.quantity ?? 0;
    if (qty < 1) return;
    const newKey = lineKeyForTile(tile, process);
    const price = unitPriceForTile(tile, process);
    setLines((prev) => {
      const without = prev.filter((l) => l.key !== oldKey && l.key !== newKey);
      return [
        ...without,
        {
          key: newKey,
          quantity: qty,
          unitPriceInr: price,
          label: tile.hinglish,
          catalogItemId: tile.catalogItemId,
          garmentItemId: tile.garmentItemId,
          process,
        },
      ];
    });
  }

  function goFromCustomer() {
    const phone = normalizeIndianPhoneInput(customerPhone);
    if (!customerName.trim()) {
      toast.error('Enter the customer name');
      return;
    }
    if (!isValidIndianMobileE164(phone)) {
      toast.error('Enter a valid Indian mobile (+91)');
      return;
    }
    if (!customerGender) {
      toast.error('Select Male or Female for tags');
      return;
    }
    setCustomerPhone(phone);
    setStep('wall');
  }

  function submitOrder() {
    const phone = normalizeIndianPhoneInput(customerPhone);
    const e164 = phone.startsWith('+') ? phone : `+${phone}`;
    if (!lines.length) {
      toast.error('Add at least one garment');
      return;
    }

    const items: WalkInOrderLineItem[] = lines.map((line) => {
      if (line.catalogItemId && line.process) {
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

    createMutation.mutate({
      customer_name: customerName.trim(),
      customer_phone: e164,
      customer_gender: customerGender ?? undefined,
      items,
      notes: notes.trim() || undefined,
    });
  }

  const loadingWall = garmentCatalogQ.isLoading || priceListQ.isLoading || servicesQ.isLoading;
  const usingServiceFallback = clothWallResolved.source === 'service';

  return (
    <PartnerContent className="space-y-4 pb-28">
      <PartnerPageHeader
        title={title}
        description={description}
        actions={
          step !== 'success' ? (
            <div
              className="flex rounded-lg bg-muted/60 p-0.5"
              role="group"
              aria-label="Picker mode"
            >
              <button
                type="button"
                onClick={() => setPickerMode('wall')}
                className={cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-medium',
                  pickerMode === 'wall'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                Cloth Wall
              </button>
              <button
                type="button"
                onClick={() => setPickerMode('list')}
                className={cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-medium',
                  pickerMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
                data-testid="list-mode-toggle"
              >
                <List className="h-3.5 w-3.5" aria-hidden />
                List mode
              </button>
            </div>
          ) : undefined
        }
      />

      {step === 'success' && createdOrder ? (
        <WalkInSuccessPanel
          order={createdOrder}
          onStartWash={() => startWashMutation.mutate(createdOrder.id)}
          startWashPending={startWashMutation.isPending}
        />
      ) : null}

      {step === 'customer' ? (
        <PartnerPanel title="Customer" description="Step A — phone, name & gender" bodyClassName="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="cw-phone" className="text-base">
              Phone (WhatsApp)
            </Label>
            <Input
              id="cw-phone"
              type="tel"
              inputMode="numeric"
              placeholder="+91XXXXXXXXXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(normalizeIndianPhoneInput(e.target.value))}
              className="min-h-14 text-lg"
              autoComplete="tel"
              aria-describedby="cw-phone-hint"
              data-testid="cloth-wall-phone"
            />
            <p id="cw-phone-hint" className="text-xs text-muted-foreground">
              Use the big buttons below to enter the number — typing is optional.
            </p>
            <PhoneNumericKeypad value={customerPhone} onChange={setCustomerPhone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cw-name" className="text-base">
              Name
            </Label>
            <Input
              id="cw-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="min-h-14 text-lg"
              autoComplete="name"
              data-testid="cloth-wall-name"
            />
          </div>
          <PartnerCustomerGenderField
            value={customerGender}
            onChange={setCustomerGender}
            size="floor"
          />
          <Button
            type="button"
            className="min-h-14 w-full text-base font-semibold"
            onClick={goFromCustomer}
            data-testid="cloth-wall-customer-next"
          >
            Cloth Wall pe jao
          </Button>
          {!floorEntry ? (
            <p className="text-center text-xs text-muted-foreground">
              Doorstep assisted?{' '}
              <Link href={buildPartnerCreateOrderHref({ mode: 'assisted' })} className="font-medium text-primary underline-offset-2 hover:underline">
                Open assisted flow
              </Link>
            </p>
          ) : null}
        </PartnerPanel>
      ) : null}

      {step === 'wall' ? (
        <div className="space-y-4" data-testid="cloth-wall-step">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {customerName} · {customerPhone}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep('customer')}>
              Edit customer
            </Button>
          </div>

          {pickerMode === 'wall' ? (
            <>
              {usingServiceFallback && !loadingWall ? (
                <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Garment rate card empty — showing Service catalog.{' '}
                  <Link
                    href="/partner/services"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Upload rate card
                  </Link>
                </p>
              ) : null}

              <ClothWallCategoryChips value={category} onChange={setCategory} />

              {loadingWall ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading clothes…
                </p>
              ) : visibleTiles.length === 0 ? (
                <PartnerPanel title="No garments" bodyClassName="p-4">
                  <p className="text-sm text-muted-foreground">
                    Nothing in this category. Try another category or List mode.
                  </p>
                </PartnerPanel>
              ) : (
                <div
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                  data-testid="cloth-wall-grid"
                >
                  {visibleTiles.map((tile, index) => {
                    const tileButton = (
                      <ClothWallTileButton
                        tile={tile}
                        quantity={qtyForTile(tile)}
                        process={processForTile(tile)}
                        onIncrement={() => bumpTile(tile, 1)}
                        onDecrement={() => bumpTile(tile, -1)}
                        onProcessChange={
                          tile.priceMode === 'dual'
                            ? (p) => changeProcess(tile, p)
                            : undefined
                        }
                        imagePriority={index < 4}
                      />
                    );
                    // First 6 tiles eager (home viewport / TTI); rest lazy-mount.
                    if (index < 6) {
                      return <div key={tile.id}>{tileButton}</div>;
                    }
                    return (
                      <LazyMount key={tile.id} minHeightClassName="min-h-[9rem]">
                        {tileButton}
                      </LazyMount>
                    );
                  })}
                </div>
              )}

              <ClothWallStickyBar
                pieceCount={pieceCount}
                subtotalInr={subtotal}
                onContinue={() => setStep('confirm')}
                continueLabel="Confirm"
              />
            </>
          ) : (
            <ListModePicker
              services={servicesQ.data ?? []}
              lines={lines}
              onAddService={(svc) => {
                const key = serviceLineKey(svc.id);
                setLines((prev) =>
                  incrementClothWallQty(prev, {
                    key,
                    unitPriceInr: Number(svc.price_inr),
                    label: svc.name,
                    serviceId: svc.id,
                  }),
                );
              }}
              onDec={(key) => setLines((prev) => decrementClothWallQty(prev, key))}
              onContinue={() => setStep('confirm')}
              pieceCount={pieceCount}
              subtotal={subtotal}
            />
          )}
        </div>
      ) : null}

      {step === 'confirm' ? (
        <PartnerPanel title="Confirm order" description="Step C" bodyClassName="space-y-4 p-4">
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{customerName}</p>
            <p className="text-muted-foreground">{customerPhone}</p>
          </div>
          <ul className="divide-y divide-border/50 rounded-xl ring-1 ring-border/50">
            {lines.map((line) => (
              <li key={line.key} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                <span className="font-medium">
                  {line.label} × {line.quantity}
                </span>
                <span className="tabular-nums">{formatInr(line.unitPriceInr * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-base font-semibold">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatInr(subtotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">GST order save par add hoga.</p>
          <div className="space-y-1.5">
            <Label htmlFor="cw-notes">Notes</Label>
            <Textarea
              id="cw-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="min-h-14 flex-1"
              onClick={() => setStep('wall')}
            >
              Back
            </Button>
            <Button
              type="button"
              className="min-h-14 flex-1 text-base font-semibold"
              onClick={submitOrder}
              disabled={createMutation.isPending}
              aria-busy={createMutation.isPending}
              data-testid="cloth-wall-submit"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                'Save order'
              )}
            </Button>
          </div>
        </PartnerPanel>
      ) : null}

      {step !== 'success' ? <FloorCoachMark step={step} /> : null}
      {step === 'success' ? <FloorCoachMark step="success" /> : null}
    </PartnerContent>
  );
}

function ListModePicker({
  services,
  lines,
  onAddService,
  onDec,
  onContinue,
  pieceCount,
  subtotal,
}: {
  services: Awaited<ReturnType<typeof listPartnerServices>>;
  lines: ClothWallLine[];
  onAddService: (svc: Awaited<ReturnType<typeof listPartnerServices>>[number]) => void;
  onDec: (key: string) => void;
  onContinue: () => void;
  pieceCount: number;
  subtotal: number;
}) {
  const active = services.filter(
    (s) => s.is_active && (s.catalog_status ?? 'active') === 'active',
  );

  return (
    <div className="space-y-4" data-testid="list-mode-picker">
      <PartnerPanel title="List mode" description="Text service picker" bodyClassName="p-4">
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active services.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((svc) => {
              const key = serviceLineKey(svc.id);
              const qty = lines.find((l) => l.key === key)?.quantity ?? 0;
              return (
                <li
                  key={svc.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-muted/30 px-3 py-3"
                >
                  <div>
                    <p className="font-medium">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatInr(Number(svc.price_inr))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {qty > 0 ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-12 w-12"
                        onClick={() => onDec(key)}
                        aria-label={`Decrease ${svc.name}`}
                      >
                        −
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-12 min-w-12"
                      onClick={() => onAddService(svc)}
                    >
                      {qty > 0 ? qty : '+'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PartnerPanel>
      <ClothWallStickyBar
        pieceCount={pieceCount}
        subtotalInr={subtotal}
        onContinue={onContinue}
        continueLabel="Confirm"
      />
    </div>
  );
}
