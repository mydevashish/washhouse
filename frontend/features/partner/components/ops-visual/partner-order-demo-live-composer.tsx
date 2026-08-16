'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInr } from '@/features/discover/detail/order-pricing';
import {
  PartnerCustomerSnapshotCards,
  PartnerNewOrderLineItemsTable,
  PartnerNewOrderServiceAddDialog,
  PartnerGarmentAddTile,
  PartnerGarmentIntakeEmpty,
  PartnerOrderCheckoutAside,
  PartnerServiceTile,
} from '@/features/partner/components/ops-visual';
import { ClothWallCategoryChips } from '@/features/partner-shop-floor/components/cloth-wall-category-chips';
import { ClothWallTileButton } from '@/features/partner-shop-floor/components/cloth-wall-tile';
import { applySuggestedPartnerPrices } from '@/features/partner-price-list/api/partner-price-list';
import { PartnerGarmentOfferDialog } from '@/features/partner-price-list/components/partner-garment-offer-dialog';
import { PartnerCustomerGenderField } from '@/features/partner/components/partner-customer-gender-field';
import { searchPartnerCustomers } from '@/features/partner/customer-desk/api';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import {
  formatPhoneInputDisplay,
  getPartnerPhoneFieldError,
  isPartnerPhoneReady,
  partnerPhoneDisplayValue,
  partnerPhoneToE164,
} from '@/features/partner/lib/partner-phone-schema';
import { PARTNER_BTN, PARTNER_INPUT } from '@/features/partner/lib/partner-compact';
import type { CustomerDeskProfile } from '@/features/partner/customer-desk/types';
import type { PartnerWalkInOrderComposer } from '@/features/partner/hooks/use-partner-walk-in-order-composer';
import { catalogLineKey, type ClothWallLine } from '@/features/partner-shop-floor/lib/cloth-wall-qty';
import {
  filterTilesByCategory,
  type ClothWallCategoryChip,
  type ClothWallTile,
  unitPriceForTile,
} from '@/features/partner-shop-floor/lib/cloth-wall-items';
import type { ServiceCatalogItem } from '@/services/partner-service-catalog';
import { cn } from '@/lib/utils';

function isPerPieceCatalogService(service: ServiceCatalogItem, hasCatalog: boolean): boolean {
  if (!hasCatalog) return false;
  const unit = (service.unit ?? '').toLowerCase();
  const cat = (service.category ?? '').toLowerCase();
  return unit === 'pc' || unit === 'piece' || cat.includes('dry');
}

type Props = {
  composer: PartnerWalkInOrderComposer;
};

export function PartnerOrderDemoLiveComposer({ composer }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerDeskProfile[]>([]);
  const [dialogService, setDialogService] = useState<ServiceCatalogItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState<ClothWallCategoryChip | 'all'>('all');
  const [catalogQty, setCatalogQty] = useState<Record<string, number>>({});
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

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchPartnerCustomers(q.trim()),
    onSuccess: (rows) => setSearchResults(rows),
    onError: () => toast.error('Customer search failed'),
  });

  const hasCatalog = composer.garmentTiles.length > 0;
  const catalogTilesFiltered = useMemo(
    () => filterTilesByCategory(composer.garmentTiles, catalogCategory),
    [composer.garmentTiles, catalogCategory],
  );

  const submitDisabled =
    composer.lineRows.length === 0 ||
    !composer.customerName.trim() ||
    !isPartnerPhoneReady(composer.customerPhone) ||
    !composer.customerGender;

  function handleSearch() {
    const q = searchQuery.trim();
    if (q.length < 2) {
      toast.error('Enter at least 2 characters (name or phone)');
      return;
    }
    const phone = partnerPhoneToE164(q);
    if (isPartnerPhoneReady(q)) {
      composer.applyCustomerFromSearch({ name: composer.customerName || 'Customer', phone });
      setSearchResults([]);
      return;
    }
    searchMutation.mutate(q);
  }

  function selectSearchResult(profile: CustomerDeskProfile) {
    composer.applyCustomerFromSearch({
      name: profile.name?.trim() || profile.phone,
      phone: profile.phone,
    });
    setSearchQuery(profile.name?.trim() || profile.phone);
    setSearchResults([]);
  }

  function openAddService(service: ServiceCatalogItem) {
    if (isPerPieceCatalogService(service, hasCatalog)) {
      setDialogService(service);
      setCatalogQty({});
      setCatalogDialogOpen(true);
      return;
    }
    setDialogService(service);
    setDialogOpen(true);
  }

  function addCatalogSelection() {
    const lines: ClothWallLine[] = [];
    for (const [tileId, qty] of Object.entries(catalogQty)) {
      if (qty < 1) continue;
      const tile = composer.garmentTiles.find((t) => t.id === tileId);
      if (!tile?.catalogItemId) continue;
      const process = tile.defaultProcess;
      const key = catalogLineKey(tile.catalogItemId, process);
      const price = unitPriceForTile(tile, process);
      lines.push({
        key,
        quantity: qty,
        unitPriceInr: price,
        label: tile.hinglish,
        catalogItemId: tile.catalogItemId,
        process,
      });
    }
    if (lines.length === 0) {
      toast.error('Select at least one garment');
      return;
    }
    composer.addCatalogLines(lines);
    setCatalogDialogOpen(false);
    setCatalogQty({});
  }

  function setCatalogTileQty(tile: ClothWallTile, qty: number) {
    setCatalogQty((prev) => ({ ...prev, [tile.id]: Math.max(0, qty) }));
  }

  function handleCreateOrder() {
    if (composer.preferredDeliveryDate.trim()) {
      composer.setExpectedReadyAt(composer.preferredDeliveryDate.trim());
    }
    composer.submitOrder();
  }

  const customerPhoneDisplay = partnerPhoneDisplayValue(composer.customerPhone);
  const customerPhoneError = getPartnerPhoneFieldError(customerPhoneDisplay);

  const snapshotProfile =
    composer.customerName.trim() &&
    isPartnerPhoneReady(composer.customerPhone) &&
    composer.walkInProfile
      ? {
          ...composer.walkInProfile,
          name: composer.customerName.trim() || composer.walkInProfile.name,
        }
      : null;

  return (
    <>
      <PartnerNewOrderServiceAddDialog
        service={dialogOpen ? dialogService : null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={(qty) => {
          if (dialogService) composer.addServiceWithQty(dialogService.id, qty);
        }}
      />

      <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogService ? `Add ${dialogService.name} items` : 'Add garment items'}
            </DialogTitle>
            <DialogDescription>
              Choose pieces from your garment price list — quantities use live rates.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {(['all', 'men', 'women', 'kids', 'household'] as const).map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={catalogCategory === cat ? 'default' : 'outline'}
                onClick={() => setCatalogCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/40 p-4">
            {catalogTilesFiltered.length === 0 ? (
              <div className="space-y-3 py-4 text-center text-sm">
                <p className="text-muted-foreground">
                  No garments on your wall yet — add items from the catalog first.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setCatalogDialogOpen(false);
                    setGarmentOfferOpen(true);
                  }}
                >
                  Add garments
                </Button>
              </div>
            ) : (
              catalogTilesFiltered.map((tile) => (
              <div
                key={tile.id}
                className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold">{tile.hinglish}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatInr(unitPriceForTile(tile, tile.defaultProcess))} / Pc
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCatalogTileQty(tile, (catalogQty[tile.id] ?? 0) - 1)
                    }
                  >
                    -
                  </Button>
                  <span className="min-w-[2rem] text-center">{catalogQty[tile.id] ?? 0}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCatalogTileQty(tile, (catalogQty[tile.id] ?? 0) + 1)
                    }
                  >
                    +
                  </Button>
                </div>
              </div>
            ))
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={addCatalogSelection}
              disabled={catalogTilesFiltered.length === 0}
            >
              Add to order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="grid gap-3 xl:grid-cols-[1.55fr_0.95fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>New order / Create order</CardTitle>
            <CardDescription>Search customer and add services with popup entry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Search Customer</p>
                  <p className="text-xs text-muted-foreground">
                    Search by name, mobile or customer ID.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name or +91 mobile"
                    className={cn('min-w-[220px]', PARTNER_INPUT)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={PARTNER_BTN}
                    disabled={searchMutation.isPending}
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={PARTNER_BTN}
                    onClick={() => {
                      setSearchQuery('');
                      composer.setCustomerName('');
                      composer.setCustomerPhone('');
                      setSearchResults([]);
                    }}
                  >
                    + New Customer
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 ? (
                <ul className="rounded-2xl border border-border bg-background p-2 text-sm">
                  {searchResults.map((row) => (
                    <li key={`${row.phone}-${row.user_id ?? 'guest'}`}>
                      <button
                        type="button"
                        className="w-full rounded-xl px-3 py-2 text-left hover:bg-muted/70"
                        onClick={() => selectSearchResult(row)}
                      >
                        <span className="font-medium">{row.name || row.phone}</span>
                        <span className="ml-2 text-muted-foreground">{row.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dash-phone">Phone (WhatsApp)</Label>
                  <Input
                    id="dash-phone"
                    type="tel"
                    inputMode="tel"
                    value={customerPhoneDisplay}
                    onChange={(e) =>
                      composer.setCustomerPhone(formatPhoneInputDisplay(e.target.value))
                    }
                    className={PARTNER_INPUT}
                    data-testid="create-order-phone"
                    aria-invalid={Boolean(customerPhoneError)}
                    aria-describedby={customerPhoneError ? 'dash-phone-error' : undefined}
                  />
                  {customerPhoneError ? (
                    <p id="dash-phone-error" className="text-xs text-danger" role="alert">
                      {customerPhoneError}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dash-name">Customer name</Label>
                  <Input
                    id="dash-name"
                    value={composer.customerName}
                    onChange={(e) => composer.setCustomerName(e.target.value)}
                    className={PARTNER_INPUT}
                    data-testid="create-order-name"
                  />
                </div>
              </div>

              <PartnerCustomerGenderField
                value={composer.customerGender}
                onChange={composer.setCustomerGender}
              />

              {snapshotProfile ? (
                <PartnerCustomerSnapshotCards
                  profile={snapshotProfile}
                  stats={composer.insightStats}
                />
              ) : null}
            </div>

            {composer.servicesQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading services…</p>
            ) : composer.services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm">
                <p className="font-medium">No active services</p>
                <Button type="button" size="sm" className="mt-3" variant="secondary" asChild>
                  <Link href="/partner/orders?workspace=services">Manage services</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {composer.services.map((svc) => (
                  <PartnerServiceTile key={svc.id} service={svc} onAdd={() => openAddService(svc)} />
                ))}
              </div>
            )}

            <div className="space-y-3 border-t border-border/50 pt-6">
              <div>
                <p className="text-sm font-semibold">By garment (piece tags)</p>
                <p className="text-xs text-muted-foreground">
                  Shirt, pant, saree — tap to add qty; use + to offer new items from catalog.
                </p>
              </div>
              {composer.loadingGarments ? (
                <p className="text-sm text-muted-foreground">Loading garment prices…</p>
              ) : composer.garmentTiles.length === 0 ? (
                <PartnerGarmentIntakeEmpty
                  onAddGarments={() => setGarmentOfferOpen(true)}
                  onApplySuggested={() => applySuggestedM.mutate()}
                  applyPending={applySuggestedM.isPending}
                />
              ) : (
                <>
                  <ClothWallCategoryChips
                    value={composer.category}
                    onChange={composer.setCategory}
                  />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {composer.visibleGarmentTiles.map((tile) => (
                      <ClothWallTileButton
                        key={tile.id}
                        tile={tile}
                        quantity={composer.qtyForTile(tile)}
                        process={composer.processForTile(tile)}
                        onIncrement={() => composer.bumpTile(tile, 1)}
                        onDecrement={() => composer.bumpTile(tile, -1)}
                        onProcessChange={(p) => composer.changeProcess(tile, p)}
                      />
                    ))}
                    <PartnerGarmentAddTile onClick={() => setGarmentOfferOpen(true)} />
                  </div>
                </>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              {composer.lineRows.length > 0 ? (
                <PartnerNewOrderLineItemsTable
                  rows={composer.lineRows}
                  onSetQty={composer.setLineQty}
                  onRemove={composer.removeLine}
                />
              ) : (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Add services or garments above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <PartnerOrderCheckoutAside
            totals={composer.checkoutTotals}
            couponCode={composer.couponCode}
            onCouponCodeChange={composer.setCouponCode}
            couponApplied={composer.couponApplied}
            onToggleCoupon={() => {
              composer.setCouponApplied(false);
              composer.setCouponDiscountInr(0);
            }}
            onApplyCoupon={composer.applyCoupon}
            applyCouponPending={composer.applyCouponPending}
            couponError={composer.couponError}
            discountType={composer.discountType}
            onDiscountTypeChange={composer.setDiscountType}
            discountValue={composer.discountValue}
            onDiscountValueChange={composer.handleDiscountValueChange}
            deliveryType={composer.deliveryType}
            onDeliveryTypeChange={composer.setDeliveryType}
            deliveryDate={composer.preferredDeliveryDate}
            onDeliveryDateChange={composer.setPreferredDeliveryDate}
            paymentMethod={composer.paymentMethod}
            onPaymentMethodChange={composer.setPaymentMethod}
            notes={composer.notes}
            onNotesChange={composer.setNotes}
            pickupCharge={composer.pickupChargeOverride}
            onPickupChargeChange={composer.setPickupChargeOverride}
            deliveryCharge={composer.deliveryChargeOverride}
            onDeliveryChargeChange={composer.setDeliveryChargeOverride}
            advancePaid={composer.advancePaid}
            onAdvancePaidChange={composer.setAdvancePaid}
            expressOrder={composer.expressOrder}
            onExpressOrderChange={composer.setExpressOrder}
            submitPending={composer.createMutation.isPending}
            submitDisabled={submitDisabled}
            submitLabel="Create Order & Generate Tags"
            onSubmit={handleCreateOrder}
          />
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Invoice &amp; tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">
                  Tracking / invoice ref
                </p>
                <p className="mt-2 font-semibold">—</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  GST finalized on save · estimate {formatInr(composer.checkoutTotals.grandTotal)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Create the order to unlock print actions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <PartnerGarmentOfferDialog
        open={garmentOfferOpen}
        onOpenChange={setGarmentOfferOpen}
        onSaved={() => void qc.invalidateQueries({ queryKey: queryKeys.partnerPriceList() })}
      />
    </>
  );
}
